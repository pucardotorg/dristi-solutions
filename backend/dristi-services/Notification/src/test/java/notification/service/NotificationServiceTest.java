package notification.service;

import notification.config.Configuration;
import notification.enrichment.NotificationEnrichment;
import notification.kafka.Producer;
import notification.repository.NotificationRepository;
import notification.service.NotificationService;
import notification.validator.NotificationValidator;
import notification.web.models.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationValidator validator;

    @Mock
    private NotificationEnrichment enrichment;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private Producer producer;

    @Mock
    private Configuration config;

    @InjectMocks
    private NotificationService notificationService;

    private NotificationRequest notificationRequest;
    private Notification notification;
    private NotificationSearchRequest searchRequest;
    private NotificationExistsRequest existsRequest;

    @BeforeEach
    void setUp() {
        notification = new Notification();
        notification.setDocuments(List.of(new Document()));
        notificationRequest = new NotificationRequest();
        notificationRequest.setNotification(notification);
        searchRequest = new NotificationSearchRequest();
        existsRequest = new NotificationExistsRequest();
    }

    @Test
    void testCreateV1Notification() {
        when(config.getCreateNotificationTopic()).thenReturn("create-topic");

        Notification result = notificationService.createV1Notification(notificationRequest);

        verify(validator).validateCreateNotificationRequest(notificationRequest);
        verify(enrichment).enrichCreateNotificationRequest(notificationRequest);
        verify(workflowService).updateWorkflowStatus(notificationRequest);
        verify(producer).push("create-topic", notificationRequest);

        assertEquals(notification, result);
    }

    @Test
    void testUpdateV1Notification() {
        when(config.getUpdateNotificationTopic()).thenReturn("update-topic");
        Notification dbNotification = new Notification();
        when(validator.validateUpdateNotificationRequest(notificationRequest)).thenReturn(dbNotification);

        Notification result = notificationService.updateV1Notification(notificationRequest);

        verify(validator).validateUpdateNotificationRequest(notificationRequest);
        verify(enrichment).enrichUpdateNotificationRequest(notificationRequest, dbNotification);
        verify(workflowService).updateWorkflowStatus(notificationRequest);
        verify(producer).push("update-topic", notificationRequest);

        assertEquals(notification, result);
    }

    @Test
    void testSearchV1Notification() {
        List<Notification> expectedNotifications = Arrays.asList(new Notification(), new Notification());
        when(notificationRepository.getNotifications(any(), any())).thenReturn(expectedNotifications);

        List<Notification> result = notificationService.searchV1Notification(searchRequest);

        verify(notificationRepository).getNotifications(searchRequest.getCriteria(), searchRequest.getPagination());
        assertEquals(expectedNotifications.size(), result.size());
    }

    @Test
    void testExistV1Notification() {
        List<NotificationExists> expectedExists = Arrays.asList(new NotificationExists(), new NotificationExists());
        when(notificationRepository.checkIfNotificationExists(any())).thenReturn(expectedExists);

        List<NotificationExists> result = notificationService.existV1Notification(existsRequest);

        verify(notificationRepository).checkIfNotificationExists(existsRequest.getNotificationList());
        assertEquals(expectedExists.size(), result.size());
    }
}

