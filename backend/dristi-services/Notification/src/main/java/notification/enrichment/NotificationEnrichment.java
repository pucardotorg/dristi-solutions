package notification.enrichment;

import notification.config.Configuration;
import notification.util.IdgenUtil;
import notification.web.models.Notification;
import notification.web.models.NotificationRequest;
import org.egov.common.contract.models.AuditDetails;
import notification.web.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class NotificationEnrichment {

    private final IdgenUtil idgenUtil;
    private final Configuration config;

    @Autowired
    public NotificationEnrichment(IdgenUtil idgenUtil, Configuration config) {
        this.idgenUtil = idgenUtil;
        this.config = config;

    }

    /**
     * Enriches the notification request for create by generating a notification number
     * and setting the audit details.
     *
     * @param request the notification request
     */
    public void enrichCreateNotificationRequest(NotificationRequest request) {

        Notification notification = request.getNotification();
        RequestInfo requestInfo = request.getRequestInfo();
        String idName = config.getNotificationConfig();
        String idFormat = config.getNotificationIdFormat();

        List<String> notificationIdList = idgenUtil.getIdList(requestInfo, notification.getTenantId(), idName, idFormat, 1, true);

        notification.setNotificationNumber(notificationIdList.get(0));

        AuditDetails auditDetails = getAuditDetailForCreate(requestInfo);
        notification.setAuditDetails(auditDetails);
        notification.setId(UUID.randomUUID());

        if (notification.getDocuments() != null) {
            notification.getDocuments().forEach(document -> {
                document.setId(String.valueOf(UUID.randomUUID()));
            });
        }


    }

    public void enrichUpdateNotificationRequest(NotificationRequest request, Notification dbNotification) {

        // this method is used to enrich id for new documents
        enrichDocumentId(request,dbNotification);
        AuditDetails auditDetails = getAuditDetailForUpdate(request.getRequestInfo(), dbNotification.getAuditDetails());
        request.getNotification().setAuditDetails(auditDetails);
    }


    /**
     * Creates an AuditDetails object for a newly created entity.
     *
     * @param requestInfo the request information containing user details
     * @return an AuditDetails object with the createdBy and lastModifiedBy set to the user's UUID,
     * and createdTime and lastModifiedTime set to the current system time
     */
    AuditDetails getAuditDetailForCreate(RequestInfo requestInfo) {
        String userId = requestInfo.getUserInfo().getUuid();
        return AuditDetails.builder()
                .createdBy(userId)
                .lastModifiedBy(userId)
                .createdTime(System.currentTimeMillis())
                .lastModifiedTime(System.currentTimeMillis())
                .build();
    }


    /**
     * Updates an AuditDetails object for an existing entity.
     *
     * @param requestInfo  the request information containing user details
     * @param auditDetails the AuditDetails object to be updated
     * @return the updated AuditDetails object with the lastModifiedBy set to the user's UUID,
     * and lastModifiedTime set to the current system time
     */
    AuditDetails getAuditDetailForUpdate(RequestInfo requestInfo, AuditDetails auditDetails) {
        String userId = requestInfo.getUserInfo().getUuid();
        auditDetails.setLastModifiedBy(userId);
        auditDetails.setLastModifiedTime(System.currentTimeMillis());

        return auditDetails;
    }

    private void enrichDocumentId(NotificationRequest notificationRequest, Notification dbNotification) {

        Set<String> documentsIdFromDb = new HashSet<>();

        List<Document> documentsFromDb = dbNotification.getDocuments();
        documentsFromDb.forEach(document -> {
            documentsIdFromDb.add(document.getId());
        });

        List<Document> documents = notificationRequest.getNotification().getDocuments();

        documents.forEach(document -> {
            if (!(document.getId() != null && documentsIdFromDb.contains(document.getId()))) {
                document.setId(String.valueOf(UUID.randomUUID()));
            }
        });
    }
}
