package notification.service;

import lombok.extern.slf4j.Slf4j;
import notification.config.Configuration;
import notification.enrichment.NotificationEnrichment;
import notification.kafka.Producer;
import notification.repository.NotificationRepository;
import notification.util.FileStoreUtil;
import notification.validator.NotificationValidator;
import notification.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationValidator validator;
    private final NotificationEnrichment enrichment;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration config;
    private final FileStoreUtil fileStoreUtil;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, NotificationValidator validator, NotificationEnrichment enrichment, WorkflowService workflowService, Producer producer, Configuration config, FileStoreUtil fileStoreUtil) {
        this.notificationRepository = notificationRepository;
        this.validator = validator;
        this.enrichment = enrichment;
        this.workflowService = workflowService;
        this.producer = producer;
        this.config = config;
        this.fileStoreUtil = fileStoreUtil;
    }


    /**
     * Creates a notification in the database.
     * <p>
     * The request object will be validated and enriched. The workflow status will be updated.
     * The request will then be pushed to a Kafka topic which will be consumed by the persister service.
     *
     * @param request the request object containing the notification to create and the RequestInfo object
     * @return the created notification
     */
    public Notification createV1Notification(NotificationRequest request) {

        // validate notification
        validator.validateCreateNotificationRequest(request);
        // enrich notification
        enrichment.enrichCreateNotificationRequest(request);
        // workflow update
        workflowService.updateWorkflowStatus(request);
        // push into producer, this topic will consume in persister service
        producer.push(config.getCreateNotificationTopic(), request);

        return request.getNotification();
    }

    /**
     * Updates a notification in the database.
     *
     * @param request the request object containing the notification to update and
     *                the RequestInfo object
     * @return the updated notification
     */
    public Notification updateV1Notification(NotificationRequest request) {

        // validate notification, if notification exist metadata update
        Notification dbNotification = validator.validateUpdateNotificationRequest(request);
        // enrich request
        enrichment.enrichUpdateNotificationRequest(request, dbNotification);
        // workflow update
        workflowService.updateWorkflowStatus(request);

        //delete inactive documents
        List<String> fileStoreIds = new ArrayList<>();
        for(Document document : request.getNotification().getDocuments()) {
            if(!document.getIsActive()) {
                fileStoreIds.add(document.getFileStore());
            }
        }
        if(!fileStoreIds.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIds, request.getNotification().getTenantId());
            log.info("Deleted files with file store ids: {}", fileStoreIds);
        }
        // push into producer, this topic will consume in persister service
        producer.push(config.getUpdateNotificationTopic(), request);

        return request.getNotification();

    }

    /**
     * Searches for notifications in the database based on the given
     * {@link NotificationSearchRequest} and returns a list of
     * {@link Notification} objects.
     *
     * @param request the request object containing the search criteria and
     *                the RequestInfo object
     * @return a list of Notification objects containing the search result
     */
    public List<Notification> searchV1Notification(NotificationSearchRequest request) {
        List<Notification> notifications = notificationRepository.getNotifications(request.getCriteria(), request.getPagination());

        return notifications;

    }

    /**
     * Returns a list of {@link NotificationExists} objects which contains
     * information about if the notification exists or not.
     *
     * @param request the request object containing the list of notifications
     *                to check for existence and the RequestInfo object
     * @return a list of NotificationExists objects containing information about
     * if the notification exists or not
     */
    public List<NotificationExists> existV1Notification(NotificationExistsRequest request) {
        List<NotificationExists> notifications = notificationRepository.checkIfNotificationExists(request.getNotificationList());
        return notifications;
    }
}
