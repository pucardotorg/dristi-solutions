package notification.enrichment;

import notification.config.Configuration;
import notification.enrichment.NotificationEnrichment;
import notification.util.IdgenUtil;
import notification.web.models.Notification;
import notification.web.models.NotificationRequest;
import org.egov.common.contract.models.AuditDetails;
import notification.web.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEnrichmentTest {

    @Mock
    private IdgenUtil idgenUtil;

    @Mock
    private Configuration config;

    @InjectMocks
    private NotificationEnrichment notificationEnrichment;

    private NotificationRequest request;
    private RequestInfo requestInfo;
    private Notification notification;

    @BeforeEach
    void setUp() {
        User user = User.builder().uuid("user-123").build();
        requestInfo = RequestInfo.builder().userInfo(user).build();
        notification = new Notification();
        notification.setTenantId("tenant-001");

        request = new NotificationRequest();
        request.setRequestInfo(requestInfo);
        request.setNotification(notification);
    }

    @Test
    void testEnrichCreateNotificationRequest() {
        when(config.getNotificationConfig()).thenReturn("notification-config");
        when(config.getNotificationIdFormat()).thenReturn("NOTIF-2024");
        when(idgenUtil.getIdList(eq(requestInfo), eq("tenant-001"), anyString(), anyString(), eq(1), eq(true)))
                .thenReturn(Collections.singletonList("NOTIF-123"));

        notificationEnrichment.enrichCreateNotificationRequest(request);

        assertNotNull(notification.getNotificationNumber());
        assertEquals("NOTIF-123", notification.getNotificationNumber());
        assertNotNull(notification.getId());
        assertNotNull(notification.getAuditDetails());
        assertEquals("user-123", notification.getAuditDetails().getCreatedBy());
        assertEquals("user-123", notification.getAuditDetails().getLastModifiedBy());
        assertTrue(notification.getAuditDetails().getCreatedTime() > 0);
    }

    @Test
    void testEnrichUpdateNotificationRequest() {
        AuditDetails existingAuditDetails = AuditDetails.builder()
                .createdBy("user-123")
                .lastModifiedBy("user-123")
                .createdTime(1690000000000L)
                .lastModifiedTime(1690000000000L)
                .build();

        RequestInfo requestInfo1 = request.getRequestInfo();
        Notification dbNotification = new Notification();
        dbNotification.setDocuments(Collections.singletonList(mock(Document.class)));
        notification.setAuditDetails(existingAuditDetails);
        dbNotification.setAuditDetails(existingAuditDetails);
        request = new NotificationRequest();
        request.setRequestInfo(requestInfo1);
        request.setNotification(dbNotification);

        notificationEnrichment.enrichUpdateNotificationRequest(request, dbNotification);

        assertNotNull(request.getNotification().getAuditDetails());
        assertEquals("user-123", request.getNotification().getAuditDetails().getLastModifiedBy());
        assertTrue(request.getNotification().getAuditDetails().getLastModifiedTime() > 1690000000000L);
    }
}
