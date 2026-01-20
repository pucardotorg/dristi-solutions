package notification.validator;

import notification.repository.NotificationRepository;
import notification.web.models.Notification;
import notification.web.models.NotificationCriteria;
import notification.web.models.NotificationRequest;
import notification.web.models.Pagination;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NotificationValidator {

    private final NotificationRepository repository;

    @Autowired
    public NotificationValidator(NotificationRepository repository) {
        this.repository = repository;
    }

    public void validateCreateNotificationRequest(NotificationRequest request) {
    }

    public Notification validateUpdateNotificationRequest(NotificationRequest request) {

        Notification notification = request.getNotification();
        RequestInfo requestInfo = request.getRequestInfo();

        NotificationCriteria criteria = NotificationCriteria.builder()
                .id(notification.getId().toString()).build();

        List<Notification> notifications = repository.getNotifications(criteria, Pagination.builder().limit(1.0).offSet(0.0).build());

        if (notifications.isEmpty()) {
            throw new CustomException("INVALID_NOTIFICATION_UPDATE", "Notification does not exist in DB");
        }

        return notifications.get(0);

    }
}
