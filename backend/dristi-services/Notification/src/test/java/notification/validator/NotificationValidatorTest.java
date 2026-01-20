package notification.validator;

import notification.repository.NotificationRepository;
import notification.web.models.Notification;
import notification.web.models.NotificationRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationValidatorTest {

    @Mock
    private NotificationRepository repository;

    @InjectMocks
    private NotificationValidator notificationValidator;

    private NotificationRequest request;
    private RequestInfo requestInfo;
    private Notification notification;

    @BeforeEach
    void setUp() {
        User user = User.builder().uuid("user-123").build();
        requestInfo = RequestInfo.builder().userInfo(user).build();
        notification = new Notification();
        notification.setId(UUID.randomUUID());

        request = new NotificationRequest();
        request.setRequestInfo(requestInfo);
        request.setNotification(notification);
    }

    @Test
    void testValidateCreateNotificationRequest() {
        assertDoesNotThrow(() -> notificationValidator.validateCreateNotificationRequest(request));
    }

    @Test
    void testValidateUpdateNotificationRequest_Success() {
        when(repository.getNotifications(any(), any()))
                .thenReturn(Collections.singletonList(notification));

        Notification result = notificationValidator.validateUpdateNotificationRequest(request);

        assertNotNull(result);
        assertEquals(notification.getId(), result.getId());
    }

    @Test
    void testValidateUpdateNotificationRequest_Failure() {
        when(repository.getNotifications(any(), any())).thenReturn(Collections.emptyList());

        Exception exception = assertThrows(CustomException.class, () ->
                notificationValidator.validateUpdateNotificationRequest(request));

        assertEquals("INVALID_NOTIFICATION_UPDATE", ((CustomException) exception).getCode());
        assertEquals("Notification does not exist in DB", exception.getMessage());
    }
}

