package digit.service;

import com.google.gson.Gson;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
    private LocalDate hearingDate;
    private String tenantId;
    private String formattedSubjectPattern;
    private String recipients;
    private String stateTenantId;
    private String emailTopic;
    private String updatedTopic;
    private DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    @BeforeEach
    void setUp() {
        requestInfo = new RequestInfo();
        fileStoreId = "test-file-store-id-123";
        hearingDate = LocalDate.of(2024, 3, 15);
        tenantId = "pb.amritsar";
        formattedSubjectPattern = "Cause List for Date: {date_of_causeList}";
        recipients = "test1@example.com, test2@example.com, test3@example.com";
        stateTenantId = "pb";
        emailTopic = "email-topic";
        updatedTopic = "pb-email-topic";

        when(config.getCauseListSubject()).thenReturn(formattedSubjectPattern);
        when(config.getCauseListRecipients()).thenReturn(recipients);
        when(config.getEgovStateTenantId()).thenReturn(stateTenantId);
        when(config.getEmailTopic()).thenReturn(emailTopic);
        when(centralInstanceUtil.getStateSpecificTopicName(tenantId, emailTopic)).thenReturn(updatedTopic);
    }

    @Test
    void testSendCauseListEmail_Success() {
        causeListEmailService.sendCauseListEmail(fileStoreId, hearingDate, requestInfo, tenantId);

        ArgumentCaptor<EmailRequest> emailRequestCaptor = ArgumentCaptor.forClass(EmailRequest.class);
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);

        verify(kafkaTemplate, times(1)).send(topicCaptor.capture(), emailRequestCaptor.capture());

        assertEquals(updatedTopic, topicCaptor.getValue());

        EmailRequest capturedEmailRequest = emailRequestCaptor.getValue();
        assertNotNull(capturedEmailRequest);
        assertEquals(requestInfo, capturedEmailRequest.getRequestInfo());

        Email capturedEmail = capturedEmailRequest.getEmail();
        assertNotNull(capturedEmail);

        String expectedDateString = hearingDate.format(dateFormatter);
        assertEquals("Cause List for Date: " + expectedDateString, capturedEmail.getSubject());

        String expectedBody = new Gson().toJson(Map.of("emailBody", ServiceConstants.CAUSE_LIST_EMAIL_BODY));
        assertEquals(expectedBody, capturedEmail.getBody());

        assertEquals(tenantId, capturedEmail.getTenantId());
        assertTrue(capturedEmail.getIsHTML());

        Set<String> emailTo = capturedEmail.getEmailTo();
        assertEquals(3, emailTo.size());
        assertTrue(emailTo.contains("test1@example.com"));
        assertTrue(emailTo.contains("test2@example.com"));
        assertTrue(emailTo.contains("test3@example.com"));

        Map<String, String> fileStoreMap = capturedEmail.getFileStoreId();
        assertEquals(1, fileStoreMap.size());
        assertEquals("CauseList_" + expectedDateString + ".pdf", fileStoreMap.get(fileStoreId));
    }

    @Test
    void testSendCauseListEmail_NullDate_ThrowsException() {
        LocalDate nullDate = null;

        CustomException exception = assertThrows(CustomException.class, () ->
                causeListEmailService.sendCauseListEmail(fileStoreId, nullDate, requestInfo, tenantId)
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
