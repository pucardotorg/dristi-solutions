package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.models.coremodels.Bill;
import digit.models.coremodels.PaymentDetail;
import digit.models.coremodels.PaymentRequest;
import digit.models.coremodels.Payment;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentUpdateServiceTest {

    @Mock private WorkflowService workflowService;
    @Mock private ObjectMapper mapper;
    @Mock private CtcApplicationRepository repository;
    @Mock private Producer producer;
    @Mock private Configuration config;
    @Mock private ServiceRequestRepository serviceRequestRepository;
    @Mock private EtreasuryUtil etreasuryUtil;
    @Mock private CaseUtil caseUtil;
    @Mock private IndexerUtils indexerUtils;
    @Mock private CacheService cacheService;

    @InjectMocks
    private PaymentUpdateService paymentUpdateService;

    private RequestInfo requestInfo;
    private CtcApplication ctcApplication;
    private PaymentRequest paymentRequest;
    private Map<String, Object> record;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder()
                        .uuid("user-1")
                        .roles(new ArrayList<>(List.of(Role.builder().code("CITIZEN").tenantId("kl").build())))
                        .build())
                .build();

        ctcApplication = CtcApplication.builder()
                .id("app-1")
                .ctcApplicationNumber("CA-001")
                .tenantId("kl")
                .courtId("KLKM52")
                .filingNumber("FIL-001")
                .caseNumber("CASE-001")
                .caseTitle("Test Case")
                .cnrNumber("CNR-001")
                .applicantName("John")
                .mobileNumber("9876543210")
                .isPartyToCase(true)
                .status("PENDING_PAYMENT")
                .selectedCaseBundle(new ArrayList<>())
                .caseBundles(new ArrayList<>())
                .auditDetails(AuditDetails.builder()
                        .createdBy("user-1")
                        .createdTime(1000L)
                        .lastModifiedBy("user-1")
                        .lastModifiedTime(1000L)
                        .build())
                .build();
    }

    private PaymentRequest buildPaymentRequest(String consumerCode, String businessService) {
        digit.models.coremodels.AuditDetails paymentAudit = digit.models.coremodels.AuditDetails.builder()
                .lastModifiedBy("system-user")
                .lastModifiedTime(2000L)
                .build();

        Bill bill = Bill.builder()
                .consumerCode(consumerCode)
                .build();

        PaymentDetail paymentDetail = PaymentDetail.builder()
                .businessService(businessService)
                .bill(bill)
                .auditDetails(paymentAudit)
                .build();

        Payment payment = Payment.builder()
                .tenantId("kl")
                .paymentDetails(List.of(paymentDetail))
                .build();

         PaymentRequest paymentRequest1 = new PaymentRequest();
         paymentRequest1.setPayment(payment);
         paymentRequest1.setRequestInfo(requestInfo);
         return paymentRequest1;
    }

    // ---- process tests ----

    @Test
    void process_shouldCallUpdateWorkflow_whenBusinessServiceMatches() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        verify(workflowService).updateWorkflowStatus(any(CtcApplication.class), eq(requestInfo));
        verify(producer).push(eq("update-topic"), any(CtcApplicationRequest.class));
        verify(cacheService).saveInRedisCache(ctcApplication);
    }

    @Test
    void process_shouldSkipNonMatchingBusinessService() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "other-service");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");

        paymentUpdateService.process(record);

        verify(workflowService, never()).updateWorkflowStatus(any(), any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void process_shouldCatchExceptionAndNotThrow() {
        record = new HashMap<>();
        when(mapper.convertValue(record, PaymentRequest.class)).thenThrow(new RuntimeException("parse error"));

        assertDoesNotThrow(() -> paymentUpdateService.process(record));
    }

    // ---- Party to case: MAKE_PAYMENT_FOR_SEND_FOR_ISSUE ----

    @Test
    void process_partyToCase_shouldSetIssueActionAndPushToIndex() {
        ctcApplication.setIsPartyToCase(true);
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        assertEquals("MAKE_PAYMENT_FOR_SEND_FOR_ISSUE", ctcApplication.getWorkflow().getAction());
        verify(indexerUtils).pushIssueCtcDocumentsToIndex(ctcApplication);
        verify(indexerUtils, never()).pushCtcApplicationTracker(any());
    }

    // ---- Not party to case: MAKE_PAYMENT_FOR_SEND_FOR_APPROVAL ----

    @Test
    void process_notPartyToCase_shouldSetApprovalActionAndPushTracker() {
        ctcApplication.setIsPartyToCase(false);
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        assertEquals("MAKE_PAYMENT_FOR_SEND_FOR_APPROVAL", ctcApplication.getWorkflow().getAction());
        verify(indexerUtils, never()).pushIssueCtcDocumentsToIndex(any());
        verify(indexerUtils).pushCtcApplicationTracker(any(CtcApplicationTracker.class));
    }

    // ---- Audit details update ----

    @Test
    void process_shouldUpdateAuditDetails() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        assertEquals("system-user", ctcApplication.getAuditDetails().getLastModifiedBy());
        assertEquals(2000L, ctcApplication.getAuditDetails().getLastModifiedTime());
    }

    // ---- Roles enrichment ----

    @Test
    void process_shouldAddSystemRolesToRequestInfo() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        List<Role> roles = requestInfo.getUserInfo().getRoles();
        assertTrue(roles.stream().anyMatch(r -> "SYSTEM_ADMIN".equals(r.getCode())));
        assertTrue(roles.stream().anyMatch(r -> "SYSTEM".equals(r.getCode())));
    }

    // ---- Cache miss → DB fallback ----

    @Test
    void process_shouldFallbackToDbWhenCacheMiss() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(List.of(ctcApplication));
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        verify(repository).getCtcApplication(any());
        verify(cacheService, times(2)).saveInRedisCache(ctcApplication);
        verify(workflowService).updateWorkflowStatus(any(CtcApplication.class), eq(requestInfo));
    }

    // ---- Application not found in DB ----

    @Test
    void process_shouldLogErrorWhenApplicationNotFoundInDb() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(Collections.emptyList());

        // The CustomException is caught by the outer try-catch in process()
        assertDoesNotThrow(() -> paymentUpdateService.process(record));
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void process_shouldLogErrorWhenDbReturnsNull() {
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(null);

        assertDoesNotThrow(() -> paymentUpdateService.process(record));
        verify(producer, never()).push(anyString(), any());
    }

    // ---- Consumer code parsing ----

    @Test
    void process_shouldParseCtcApplicationNumberFromConsumerCode() {
        paymentRequest = buildPaymentRequest("APP-123_SOME_FEE_TYPE", "ctc-services");
        record = new HashMap<>();

        CtcApplication app = CtcApplication.builder()
                .ctcApplicationNumber("APP-123")
                .tenantId("kl")
                .courtId("KLKM52")
                .filingNumber("FIL-002")
                .caseNumber("CASE-002")
                .caseTitle("Another Case")
                .applicantName("Jane")
                .isPartyToCase(true)
                .status("PENDING_PAYMENT")
                .selectedCaseBundle(new ArrayList<>())
                .caseBundles(new ArrayList<>())
                .auditDetails(AuditDetails.builder()
                        .createdBy("user-2")
                        .createdTime(500L)
                        .lastModifiedBy("user-2")
                        .lastModifiedTime(500L)
                        .build())
                .build();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("APP-123")).thenReturn(app);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        verify(cacheService).searchRedisCache("APP-123");
        verify(workflowService).updateWorkflowStatus(eq(app), eq(requestInfo));
    }

    // ---- Not party to case tracker includes searchable fields ----

    @Test
    void process_notPartyToCase_shouldBuildTrackerWithSearchableFields() {
        ctcApplication.setIsPartyToCase(false);
        ctcApplication.setCaseTitle("Civil Dispute");
        ctcApplication.setCaseNumber("CASE-999");
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        ArgumentCaptor<CtcApplicationTracker> trackerCaptor = ArgumentCaptor.forClass(CtcApplicationTracker.class);
        verify(indexerUtils).pushCtcApplicationTracker(trackerCaptor.capture());

        CtcApplicationTracker tracker = trackerCaptor.getValue();
        assertEquals("kl", tracker.getTenantId());
        assertEquals("KLKM52", tracker.getCourtId());
        assertEquals("FIL-001", tracker.getFilingNumber());
        assertEquals("CA-001", tracker.getCtcApplicationNumber());
        assertEquals("John", tracker.getApplicantName());
        assertEquals("Civil Dispute", tracker.getCaseTitle());
        assertEquals("CASE-999", tracker.getCaseNumber());
        assertTrue(tracker.getSearchableFields().contains("Civil Dispute"));
        assertTrue(tracker.getSearchableFields().contains("CASE-999"));
    }

    @Test
    void process_notPartyToCase_nullCaseTitleAndNumber_shouldBuildEmptySearchableFields() {
        ctcApplication.setIsPartyToCase(false);
        ctcApplication.setCaseTitle(null);
        ctcApplication.setCaseNumber(null);
        paymentRequest = buildPaymentRequest("CA-001_CTC_APPLICATION_FEE", "ctc-services");
        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        ArgumentCaptor<CtcApplicationTracker> trackerCaptor = ArgumentCaptor.forClass(CtcApplicationTracker.class);
        verify(indexerUtils).pushCtcApplicationTracker(trackerCaptor.capture());

        assertTrue(trackerCaptor.getValue().getSearchableFields().isEmpty());
    }

    // ---- Multiple payment details ----

    @Test
    void process_shouldProcessOnlyMatchingPaymentDetails() {
        digit.models.coremodels.AuditDetails paymentAudit = digit.models.coremodels.AuditDetails.builder()
                .lastModifiedBy("system-user")
                .lastModifiedTime(2000L)
                .build();

        Bill bill1 = Bill.builder().consumerCode("CA-001_CTC_APPLICATION_FEE").build();
        PaymentDetail pd1 = PaymentDetail.builder()
                .businessService("ctc-services")
                .bill(bill1)
                .auditDetails(paymentAudit)
                .build();

        Bill bill2 = Bill.builder().consumerCode("OTHER-001_FEE").build();
        PaymentDetail pd2 = PaymentDetail.builder()
                .businessService("other-service")
                .bill(bill2)
                .auditDetails(paymentAudit)
                .build();

        Payment payment = Payment.builder()
                .tenantId("kl")
                .paymentDetails(List.of(pd1, pd2))
                .build();

        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setPayment(payment);
        paymentRequest.setRequestInfo(requestInfo);

        record = new HashMap<>();

        when(mapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);
        when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
        when(cacheService.searchRedisCache("CA-001")).thenReturn(ctcApplication);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        paymentUpdateService.process(record);

        // Only one call to updateWorkflowStatus for the matching payment detail
        verify(workflowService, times(1)).updateWorkflowStatus(any(CtcApplication.class), eq(requestInfo));
    }
}
