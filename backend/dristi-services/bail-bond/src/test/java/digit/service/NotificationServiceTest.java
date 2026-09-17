package digit.service;

import digit.config.Configuration;
import digit.kafka.Producer;
import digit.repository.ServiceRequestRepository;
import digit.util.DateUtil;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {

    @InjectMocks
    private NotificationService notificationService;

    @Mock
    private Configuration config;

    @Mock
    private Producer producer;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private DateUtil dateUtil;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAsValueForPerson() {
        assertEquals("as Accused", notificationService.getAsValueForPerson("LITIGANT"));
        assertEquals("as Surety", notificationService.getAsValueForPerson("SURETY"));
        assertEquals("", notificationService.getAsValueForPerson("ADVOCATE"));
    }

    @Test
    void testBuildSubject() {
        EmailTemplateData emailTemplateData = new EmailTemplateData();
        emailTemplateData.setCaseName("State vs John");

        EmailRecipientData recipientData = new EmailRecipientData();
        recipientData.setType("LITIGANT");

        String subjectTemplate = "Bail Request {{as}} for {{caseName}}";
        String result = notificationService.buildSubject(subjectTemplate, emailTemplateData, recipientData);

        assertEquals("Bail Request as Accused for State vs John", result);
    }

    @Test
    void testBuildBody() {
        when(dateUtil.getFormattedCurrentDate()).thenReturn("28-07-2025");

        EmailTemplateData templateData = new EmailTemplateData();
        templateData.setCaseNumber("12345");
        templateData.setCaseName("State vs Doe");
        templateData.setShortenedURL("http://short.url");

        EmailRecipientData recipient = new EmailRecipientData();
        recipient.setName("John Doe");
        recipient.setType("SURETY");

        String bodyTemplate = "Hello {{name}}, your bail request {{as}} for case {{caseNumber}} - {{caseName}} is recorded on {{date}}. Visit {{shortenedURL}}";

        String result = notificationService.buildBody(bodyTemplate, templateData, recipient);

        assertTrue(result.contains("Hello John Doe"));
        assertTrue(result.contains("as Surety"));
        assertTrue(result.contains("12345"));
        assertTrue(result.contains("28-07-2025"));
    }

    @Test
    void testBuildEmailRequest() {
        EmailContent content = new EmailContent("Subject", "Body");
        RequestInfo requestInfo = new RequestInfo();
        String tenantId = "kl";

        Set<String> recipients = Set.of("john@example.com");

        EmailRequest result = notificationService.buildEmailRequest(content, requestInfo, tenantId, recipients);

        assertEquals("Subject", result.getEmail().getSubject());
        assertEquals("Body", result.getEmail().getBody());
        assertEquals(recipients, result.getEmail().getEmailTo());
        assertEquals("kl", result.getEmail().getTenantId());
    }

    @Test
    void testSendEmailSuccess() {
        EmailTemplateData templateData = new EmailTemplateData();
        templateData.setTenantId("kl");
        templateData.setCaseNumber("123");
        templateData.setCaseName("Test Case");
        templateData.setShortenedURL("http://short.url");

        EmailRecipientData recipient = new EmailRecipientData();
        recipient.setEmail("abc@example.com");
        recipient.setName("John");
        recipient.setType("LITIGANT");

        BailRequest bailRequest = new BailRequest();
        RequestInfo reqInfo = new RequestInfo();
        bailRequest.setRequestInfo(reqInfo);

        when(dateUtil.getFormattedCurrentDate()).thenReturn("28-07-2025");

        notificationService.sendEmail(bailRequest, templateData, recipient);

        verify(producer).push(any(), any(EmailRequest.class));

    }

    @Test
    void testGetMessage() {
        RequestInfo requestInfo = new RequestInfo();
        String local = "en_IN";
        String rootTenantId = "kl";
        String messageCode = "BAIL_BOND_INITIATED_LITIGANT";

        Map<String, Object> result = Map.of(
                "messages", List.of(
                        Map.of("code", "BAIL_BOND_INITIATED_LITIGANT", "message", "Bail bond initiated for litigant.")
                )
        );

        when(repository.fetchResult(any(), any())).thenReturn(result);


        String message = notificationService.getMessage(requestInfo, rootTenantId, messageCode);

        assertEquals("Bail bond initiated for litigant.", message);
    }
}







