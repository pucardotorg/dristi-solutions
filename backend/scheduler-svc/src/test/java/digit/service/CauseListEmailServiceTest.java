package digit.service;

import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.web.models.email.Email;
import digit.web.models.email.EmailRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;

import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CauseListEmailServiceTest {

    @Mock
    private CustomKafkaTemplate<String, EmailRequest> kafkaTemplate;

    @Mock
    private Configuration config;

    @Mock
    private MultiStateInstanceUtil centralInstanceUtil;

    @InjectMocks
    private CauseListEmailService causeListEmailService;

    private RequestInfo requestInfo;
    private String fileStoreId;
    private String hearingDate;
    private String tenantId;
    private String formattedSubject;
    private String recipients;
    private String stateTenantId;
    private String emailTopic;
    private String updatedTopic;

    @BeforeEach
    void setUp() {
        requestInfo = new RequestInfo();
        fileStoreId = "test-file-store-id-123";
        hearingDate = "2024-03-15";
        tenantId = "pb.amritsar";
        formattedSubject = "Cause List for Date: ${date_of_causeList}";
        recipients = "test1@example.com, test2@example.com, test3@example.com";
        stateTenantId = "pb";
        emailTopic = "email-topic";
        updatedTopic = "pb-email-topic";

        // Common mock setup used in tests
        when(config.getCauseListSubject()).thenReturn(formattedSubject);
        when(config.getCauseListRecipients()).thenReturn(recipients);
        when(config.getEgovStateTenantId()).thenReturn(stateTenantId);
        when(config.getEmailTopic()).thenReturn(emailTopic);
        when(centralInstanceUtil.getStateSpecificTopicName(tenantId, emailTopic)).thenReturn(updatedTopic);
    }

    @Test
    void testSendCauseListEmail_Success() {
        // Act
        causeListEmailService.sendCauseListEmail(fileStoreId, hearingDate, requestInfo, tenantId);

        // Capture sent email
        ArgumentCaptor<EmailRequest> emailRequestCaptor = ArgumentCaptor.forClass(EmailRequest.class);
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);

        verify(kafkaTemplate, times(1)).send(topicCaptor.capture(), emailRequestCaptor.capture());

        assertEquals(updatedTopic, topicCaptor.getValue());

        EmailRequest capturedEmailRequest = emailRequestCaptor.getValue();
        assertNotNull(capturedEmailRequest);
        assertEquals(requestInfo, capturedEmailRequest.getRequestInfo());

        Email capturedEmail = capturedEmailRequest.getEmail();
        assertNotNull(capturedEmail);
        assertEquals("Cause List for Date: 15-03-2024", capturedEmail.getSubject());
        assertEquals(ServiceConstants.CAUSE_LIST_EMAIL_BODY, capturedEmail.getBody());
        assertEquals(stateTenantId, capturedEmail.getTenantId());
        assertFalse(capturedEmail.getIsHTML());

        Set<String> emailTo = capturedEmail.getEmailTo();
        assertEquals(3, emailTo.size());
        assertTrue(emailTo.contains("test1@example.com"));
        assertTrue(emailTo.contains("test2@example.com"));
        assertTrue(emailTo.contains("test3@example.com"));

        Map<String, String> fileStoreMap = capturedEmail.getFileStoreId();
        assertEquals(1, fileStoreMap.size());
        assertEquals("CauseList_15-03-2024.pdf", fileStoreMap.get(fileStoreId));
    }

    @Test
    void testSendCauseListEmail_InvalidDateFormat_ThrowsException() {
        String invalidDate = "invalid-date";

        CustomException exception = assertThrows(CustomException.class, () ->
                causeListEmailService.sendCauseListEmail(fileStoreId, invalidDate, requestInfo, tenantId)
        );

        assertEquals(ServiceConstants.EMAIL_SEND_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains(ServiceConstants.EMAIL_SEND_ERROR_MESSAGE));

        verify(kafkaTemplate, never()).send(anyString(), any(EmailRequest.class));
    }

    @Test
    void testSendCauseListEmail_KafkaException_ThrowsCustomException() {
        doThrow(new RuntimeException("Kafka connection failed"))
                .when(kafkaTemplate).send(anyString(), any(EmailRequest.class));

        CustomException exception = assertThrows(CustomException.class, () ->
                causeListEmailService.sendCauseListEmail(fileStoreId, hearingDate, requestInfo, tenantId)
        );

        assertEquals(ServiceConstants.EMAIL_SEND_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains("Kafka connection failed"));
    }

    @Test
    void testSendCauseListEmail_VerifyStateSpecificTopic() {
        String customTenantId = "hr.panipat";
        String customUpdatedTopic = "hr-email-topic";

        when(centralInstanceUtil.getStateSpecificTopicName(customTenantId, emailTopic))
                .thenReturn(customUpdatedTopic);

        causeListEmailService.sendCauseListEmail(fileStoreId, hearingDate, requestInfo, customTenantId);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), any(EmailRequest.class));

        assertEquals(customUpdatedTopic, topicCaptor.getValue());
    }
}
