//package org.pucar.dristi.service;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import digit.models.coremodels.Bill;
//import digit.models.coremodels.PaymentDetail;
//import digit.models.coremodels.PaymentRequest;
//import digit.models.coremodels.Payment;
//import org.egov.common.contract.models.AuditDetails;
//import org.egov.common.contract.request.RequestInfo;
//import org.egov.common.contract.request.Role;
//import org.egov.common.contract.request.User;
//import org.egov.tracer.model.CustomException;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.*;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.pucar.dristi.config.Configuration;
//import org.pucar.dristi.kafka.Producer;
//import org.pucar.dristi.repository.CtcApplicationRepository;
//import org.pucar.dristi.repository.ServiceRequestRepository;
//import org.pucar.dristi.util.CaseUtil;
//import org.pucar.dristi.util.EtreasuryUtil;
//import org.pucar.dristi.util.IndexerUtils;
//import org.pucar.dristi.web.models.*;
//
//import java.util.*;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class PaymentUpdateServiceTest {
//
//    @Mock private WorkflowService workflowService;
//    @Spy  private ObjectMapper mapper = new ObjectMapper();
//    @Mock private CtcApplicationRepository repository;
//    @Mock private Producer producer;
//    @Mock private Configuration config;
//    @Mock private ServiceRequestRepository serviceRequestRepository;
//    @Mock private EtreasuryUtil etreasuryUtil;
//    @Mock private CaseUtil caseUtil;
//    @Mock private IndexerUtils indexerUtils;
//
//    @InjectMocks
//    private PaymentUpdateService paymentUpdateService;
//
//    private CtcApplication ctcApplication;
//    private RequestInfo requestInfo;
//
//    @BeforeEach
//    void setUp() {
//        requestInfo = RequestInfo.builder()
//                .userInfo(User.builder()
//                        .uuid("user-1")
//                        .roles(new ArrayList<>(List.of(Role.builder().code("EMPLOYEE").tenantId("kl").build())))
//                        .build())
//                .build();
//
//        ctcApplication = CtcApplication.builder()
//                .id("app-1")
//                .ctcApplicationNumber("CA-001")
//                .tenantId("kl")
//                .courtId("KLKM52")
//                .filingNumber("FIL-001")
//                .caseTitle("State vs John")
//                .caseNumber("CC/123/2025")
//                .cnrNumber("CNR-001")
//                .applicantName("John")
//                .mobileNumber("9876543210")
//                .isPartyToCase(true)
//                .status("PENDING_PAYMENT")
//                .auditDetails(AuditDetails.builder()
//                        .createdBy("user-1").createdTime(1000L)
//                        .lastModifiedBy("user-1").lastModifiedTime(1000L).build())
//                .build();
//
//        lenient().when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
//        lenient().when(config.getUpdateCtcApplicationTopic()).thenReturn("update-ctc");
//    }
//
//    private Map<String, Object> buildPaymentRecord(String consumerCode, String businessService) {
//        Map<String, Object> record = new HashMap<>();
//
//        Map<String, Object> billMap = new HashMap<>();
//        billMap.put("consumerCode", consumerCode);
//
//        Map<String, Object> paymentAudit = new HashMap<>();
//        paymentAudit.put("lastModifiedBy", "system");
//        paymentAudit.put("lastModifiedTime", 2000L);
//
//        Map<String, Object> paymentDetail = new HashMap<>();
//        paymentDetail.put("businessService", businessService);
//        paymentDetail.put("bill", billMap);
//        paymentDetail.put("auditDetails", paymentAudit);
//
//        Map<String, Object> payment = new HashMap<>();
//        payment.put("tenantId", "kl");
//        payment.put("paymentDetails", List.of(paymentDetail));
//
//        Map<String, Object> userInfo = new HashMap<>();
//        userInfo.put("uuid", "user-1");
//        userInfo.put("roles", new ArrayList<>(List.of(Map.of("code", "EMPLOYEE", "tenantId", "kl"))));
//
//        Map<String, Object> reqInfo = new HashMap<>();
//        reqInfo.put("userInfo", userInfo);
//
//        record.put("Payment", payment);
//        record.put("RequestInfo", reqInfo);
//
//        return record;
//    }
//
//    @Test
//    void process_shouldCallUpdateWorkflowForMatchingBusinessService() {
//        ctcApplication.setIsPartyToCase(true);
//        when(repository.getCtcApplication(any(CtcApplicationSearchRequest.class)))
//                .thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        verify(workflowService, atLeastOnce()).updateWorkflowStatus(any(CtcApplication.class), any(RequestInfo.class));
//        verify(indexerUtils).pushIssueCtcDocumentsToIndex(any(CtcApplication.class));
//        verify(producer).push(eq("update-ctc"), any(CtcApplicationRequest.class));
//    }
//
//    @Test
//    void process_shouldPushTrackerWhenNotPartyToCase() {
//        ctcApplication.setIsPartyToCase(false);
//        when(repository.getCtcApplication(any(CtcApplicationSearchRequest.class)))
//                .thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        verify(indexerUtils, never()).pushIssueCtcDocumentsToIndex(any());
//        verify(indexerUtils).pushCtcApplicationTracker(any(CtcApplicationTracker.class));
//        verify(producer).push(eq("update-ctc"), any(CtcApplicationRequest.class));
//    }
//
//    @Test
//    void process_shouldBuildTrackerWithSearchableFields() {
//        ctcApplication.setIsPartyToCase(false);
//        ctcApplication.setCaseTitle("State vs John");
//        ctcApplication.setCaseNumber("CC/123/2025");
//        when(repository.getCtcApplication(any())).thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        ArgumentCaptor<CtcApplicationTracker> captor = ArgumentCaptor.forClass(CtcApplicationTracker.class);
//        verify(indexerUtils).pushCtcApplicationTracker(captor.capture());
//
//        CtcApplicationTracker tracker = captor.getValue();
//        assertEquals("kl", tracker.getTenantId());
//        assertEquals("KLKM52", tracker.getCourtId());
//        assertEquals("FIL-001", tracker.getFilingNumber());
//        assertEquals("CA-001", tracker.getCtcApplicationNumber());
//        assertEquals("John", tracker.getApplicantName());
//        assertEquals(2, tracker.getSearchableFields().size());
//        assertTrue(tracker.getSearchableFields().contains("State vs John"));
//        assertTrue(tracker.getSearchableFields().contains("CC/123/2025"));
//    }
//
//    @Test
//    void process_shouldSkipNonMatchingBusinessService() {
//        Map<String, Object> record = buildPaymentRecord("CA-001_FEE", "other-service");
//
//        paymentUpdateService.process(record);
//
//        verifyNoInteractions(indexerUtils);
//        verify(producer, never()).push(anyString(), any());
//    }
//
//    @Test
//    void process_shouldThrowWhenNoApplicationFound() {
//        when(repository.getCtcApplication(any())).thenReturn(Collections.emptyList());
//
//        Map<String, Object> record = buildPaymentRecord("CA-MISSING_FEE", "ctc-services");
//
//        // process catches all exceptions internally, so no throw
//        assertDoesNotThrow(() -> paymentUpdateService.process(record));
//    }
//
//    @Test
//    void process_shouldAddSystemRolesToRequestInfo() {
//        ctcApplication.setIsPartyToCase(true);
//        when(repository.getCtcApplication(any())).thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        ArgumentCaptor<CtcApplicationRequest> captor = ArgumentCaptor.forClass(CtcApplicationRequest.class);
//        verify(producer).push(eq("update-ctc"), captor.capture());
//
//        List<Role> roles = captor.getValue().getRequestInfo().getUserInfo().getRoles();
//        assertTrue(roles.stream().anyMatch(r -> "SYSTEM_ADMIN".equals(r.getCode())));
//        assertTrue(roles.stream().anyMatch(r -> "SYSTEM".equals(r.getCode())));
//    }
//
//    @Test
//    void process_shouldSetCorrectWorkflowActionForPartyToCase() {
//        ctcApplication.setIsPartyToCase(true);
//        when(repository.getCtcApplication(any())).thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        ArgumentCaptor<CtcApplication> captor = ArgumentCaptor.forClass(CtcApplication.class);
//        verify(workflowService, atLeastOnce()).updateWorkflowStatus(captor.capture(), any());
//
//        List<CtcApplication> allCalls = captor.getAllValues();
//        assertTrue(allCalls.stream().anyMatch(a -> "MAKE_PAYMENT_FOR_SEND_FOR_ISSUE".equals(a.getWorkflow().getAction())));
//    }
//
//    @Test
//    void process_shouldSetCorrectWorkflowActionForNonPartyToCase() {
//        ctcApplication.setIsPartyToCase(false);
//        when(repository.getCtcApplication(any())).thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        ArgumentCaptor<CtcApplication> captor = ArgumentCaptor.forClass(CtcApplication.class);
//        verify(workflowService, atLeastOnce()).updateWorkflowStatus(captor.capture(), any());
//
//        List<CtcApplication> allCalls = captor.getAllValues();
//        assertTrue(allCalls.stream().anyMatch(a -> "MAKE_PAYMENT_FOR_SEND_FOR_APPROVAL".equals(a.getWorkflow().getAction())));
//    }
//
//    @Test
//    void process_shouldUpdateAuditDetailsFromPaymentDetail() {
//        ctcApplication.setIsPartyToCase(true);
//        when(repository.getCtcApplication(any())).thenReturn(List.of(ctcApplication));
//
//        Map<String, Object> record = buildPaymentRecord("CA-001_CTC_FEE", "ctc-services");
//
//        paymentUpdateService.process(record);
//
//        // auditDetails should be updated from payment detail
//        assertEquals("system", ctcApplication.getAuditDetails().getLastModifiedBy());
//    }
//}
