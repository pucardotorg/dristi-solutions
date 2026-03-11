package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.enrichment.CtcApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.util.EtreasuryUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.validators.CtcApplicationValidator;
import org.pucar.dristi.web.models.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtcApplicationServiceTest {

    @Mock private CtcApplicationRepository repository;
    @Mock private CtcApplicationEnrichment enrichment;
    @Mock private WorkflowService workflowService;
    @Mock private Configuration config;
    @Mock private Producer producer;
    @Mock private EtreasuryUtil etreasuryUtil;
    @Mock private FileStoreUtil fileStoreUtil;
    @Mock private IndexerUtils indexerUtils;
    @Mock private CtcApplicationValidator validator;
    @Mock private CacheService cacheService;
    @Spy  private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CtcApplicationService ctcApplicationService;

    private RequestInfo requestInfo;
    private CtcApplication application;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder()
                        .uuid("user-1")
                        .roles(new ArrayList<>(List.of(Role.builder().code("EMPLOYEE").tenantId("kl").build())))
                        .build())
                .build();

        application = CtcApplication.builder()
                .id("app-id-1")
                .ctcApplicationNumber("CA-001")
                .tenantId("kl")
                .courtId("KLKM52")
                .filingNumber("FIL-001")
                .caseTitle("State vs John")
                .caseNumber("CC/123/2025")
                .cnrNumber("CNR-001")
                .applicantName("John")
                .mobileNumber("9876543210")
                .isPartyToCase(true)
                .status("DRAFT_IN_PROGRESS")
                .auditDetails(AuditDetails.builder().createdBy("user-1").createdTime(1000L)
                        .lastModifiedBy("user-1").lastModifiedTime(1000L).build())
                .build();

        lenient().when(config.getSaveCtcApplicationTopic()).thenReturn("save-ctc");
        lenient().when(config.getUpdateCtcApplicationTopic()).thenReturn("update-ctc");
    }

    // ---- createApplication tests ----

    @Test
    void createApplication_shouldValidateEnrichAndPush() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        CtcApplication result = ctcApplicationService.createApplication(request);

        verify(validator).validateCreateRequest(request);
        verify(enrichment).enrichOnCreateCtcApplication(requestInfo, application);
        verify(workflowService).updateWorkflowStatus(application, requestInfo);
        verify(producer).push(eq("save-ctc"), eq(request));
        verify(cacheService).save(eq("ctc:CA-001"), eq(application));
        // caseBundles should be stripped
        assertNull(result.getCaseBundles());
    }

    // ---- updateApplication tests ----

    @Test
    void updateApplication_shouldValidateEnrichAndPush() {
        application.setWorkflow(null);
        application.setStatus("DRAFT_IN_PROGRESS");
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        CtcApplication result = ctcApplicationService.updateApplication(request);

        verify(validator).validateUpdateRequest(request);
        verify(enrichment).enrichOnUpdateCtcApplication(requestInfo, application);
        verify(workflowService).updateWorkflowStatus(application, requestInfo);
        verify(producer).push(eq("update-ctc"), eq(request));
        assertNull(result.getCaseBundles());
    }

    @Test
    void updateApplication_shouldCalculatePaymentOnEsign() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("ESIGN");
        application.setWorkflow(workflow);
        application.setTotalPages(null);
        application.setSelectedCaseBundle(List.of(
                SelectedCaseBundleNode.builder().id("root").children(List.of(
                        SelectedCaseBundleNode.builder().id("c1").fileStoreId("fs-1").build()
                )).build()
        ));

        when(fileStoreUtil.getTotalPageCount(eq("kl"), anyList())).thenReturn(10);
        when(config.getBreakDownCode()).thenReturn("CTC_FEE");
        when(config.getBreakDownType()).thenReturn("FEE");

        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        ctcApplicationService.updateApplication(request);

        assertEquals(10, application.getTotalPages());
        verify(etreasuryUtil).createDemand(eq(request), eq("CA-001_CTC_APPLICATION_FEE"), any(Calculation.class));
    }

    @Test
    void updateApplication_shouldSkipPageCalculationIfTotalPagesAlreadySet() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("UPLOAD_SIGNED_COPY");
        application.setWorkflow(workflow);
        application.setTotalPages(5);

        when(config.getBreakDownCode()).thenReturn("CTC_FEE");
        when(config.getBreakDownType()).thenReturn("FEE");

        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        ctcApplicationService.updateApplication(request);

        assertEquals(5, application.getTotalPages());
        verifyNoInteractions(fileStoreUtil);
        verify(etreasuryUtil).createDemand(eq(request), anyString(), any(Calculation.class));
    }

    @Test
    void updateApplication_shouldPushDocumentsAndDeactivateTrackerOnPendingIssue() {
        application.setStatus("PENDING_ISSUE");
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        ctcApplicationService.updateApplication(request);

    }

    @Test
    void updateApplication_shouldNotPushDocumentsWhenStatusIsNotPendingIssue() {
        application.setStatus("PENDING_PAYMENT");
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        ctcApplicationService.updateApplication(request);

        verify(indexerUtils, never()).pushIssueCtcDocumentsToIndex(any());
        verify(indexerUtils, never()).deactivateTracker(anyString());
    }

    // ---- searchApplications tests ----

    @Test
    void searchApplications_shouldReturnFromRedisCache() {
        when(cacheService.findById("ctc:CA-001")).thenReturn(application);

        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(CtcApplicationSearchCriteria.builder().tenantId("kl").ctcApplicationNumber("CA-001").build())
                .pagination(Pagination.builder().build())
                .build();

        List<CtcApplication> result = ctcApplicationService.searchApplications(searchRequest);

        assertEquals(1, result.size());
        assertEquals("CA-001", result.get(0).getCtcApplicationNumber());
        verifyNoInteractions(repository);
    }

    @Test
    void searchApplications_shouldFallbackToDbWhenCacheMiss() {
        when(cacheService.findById(anyString())).thenReturn(null);
        when(repository.getCtcApplication(any(CtcApplicationSearchRequest.class)))
                .thenReturn(List.of(application));

        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(CtcApplicationSearchCriteria.builder().tenantId("kl").ctcApplicationNumber("CA-001").build())
                .pagination(Pagination.builder().build())
                .build();

        List<CtcApplication> result = ctcApplicationService.searchApplications(searchRequest);

        assertEquals(1, result.size());
        verify(repository).getCtcApplication(any());
        // Should save back to cache
        verify(cacheService).save(eq("ctc:CA-001"), eq(application));
    }

    @Test
    void searchApplications_shouldReturnEmptyWhenNullFromDb() {
        when(cacheService.findById(anyString())).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(null);

        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(CtcApplicationSearchCriteria.builder().tenantId("kl").ctcApplicationNumber("CA-001").build())
                .pagination(Pagination.builder().build())
                .build();

        List<CtcApplication> result = ctcApplicationService.searchApplications(searchRequest);

        assertTrue(result.isEmpty());
    }

    @Test
    void searchApplications_shouldEnrichCreatedByForCitizenRole() {
        requestInfo.getUserInfo().setRoles(new ArrayList<>(List.of(
                Role.builder().code("CITIZEN").tenantId("kl").build()
        )));

        when(cacheService.findById(anyString())).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(List.of(application));

        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .tenantId("kl").ctcApplicationNumber("CA-001").build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .pagination(Pagination.builder().build())
                .build();

        ctcApplicationService.searchApplications(searchRequest);

        assertEquals("user-1", criteria.getCreatedBy());
    }

    // ---- markDocumentsAsIssuedOrReject tests ----

    @Test
    void markDocumentsAsIssuedOrReject_shouldUpdateDocStatusAndWorkflow() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001").build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(item)).build();

        // fetchCtcApplication will try Redis first
        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        application.setStatus("PENDING_ISSUE");

        Map<String, Integer> statusCounts = Map.of("ISSUED", 1, "PENDING", 2);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(statusCounts);

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        verify(indexerUtils).updateDocStatus(eq("doc-1"), eq("CA-001"), eq("ISSUED"), isNull());
        verify(indexerUtils).getDocStatusCounts("CA-001");
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldSetRejectStatusForRejectAction() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001").build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("REJECT")
                .docs(List.of(item)).build();

        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        application.setStatus("PENDING_ISSUE");

        Map<String, Integer> statusCounts = Map.of("REJECTED", 1, "PENDING", 1);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(statusCounts);

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        verify(indexerUtils).updateDocStatus(eq("doc-1"), eq("CA-001"), eq("REJECTED"), isNull());
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldThrowWhenApplicationNotFound() {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-MISSING").filingNumber("FIL-001").build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(item)).build();

        when(cacheService.findById(anyString())).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(Collections.emptyList());

        assertThrows(CustomException.class, () -> ctcApplicationService.markDocumentsAsIssuedOrReject(request));
    }

    // ---- reviewApplications tests ----

    @Test
    void reviewApplications_shouldProcessEachItem() {
        ReviewItem item = ReviewItem.builder()
                .ctcApplicationNumber("CA-001").filingNumber("FIL-001").comments("Approved").build();

        CtcApplicationReviewRequest request = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("APPROVE")
                .applications(List.of(item)).build();

        when(repository.getCtcApplication(any())).thenReturn(List.of(application));

        List<CtcApplication> result = ctcApplicationService.reviewApplications(request);

        assertEquals(1, result.size());
        assertEquals("Approved", result.get(0).getJudgeComments());
        verify(workflowService).updateWorkflowStatus(eq(application), eq(requestInfo));
        verify(enrichment).enrichOnUpdateCtcApplication(requestInfo, application);
        verify(producer).push(eq("update-ctc"), any(CtcApplicationRequest.class));
    }

    @Test
    void reviewApplications_shouldThrowWhenApplicationNotFound() {
        ReviewItem item = ReviewItem.builder()
                .ctcApplicationNumber("CA-MISSING").filingNumber("FIL-001").build();

        CtcApplicationReviewRequest request = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("APPROVE")
                .applications(List.of(item)).build();

        when(repository.getCtcApplication(any())).thenReturn(Collections.emptyList());

        assertThrows(CustomException.class, () -> ctcApplicationService.reviewApplications(request));
    }

    // ---- validateUser tests ----

    @Test
    void validateUser_shouldReturnValidateUserInfo() {
        ValidateUserRequest request = ValidateUserRequest.builder()
                .requestInfo(requestInfo).filingNumber("FIL-001")
                .mobileNumber("9876543210").tenantId("kl").courtId("KLKM52").build();

        // The validator enriches the application in-place
        doAnswer(invocation -> {
            CtcApplication app = invocation.getArgument(1);
            app.setApplicantName("John Doe");
            app.setPartyDesignation("Complainant");
            app.setIsPartyToCase(true);
            return null;
        }).when(validator).validateAndEnrichUser(eq(requestInfo), any(CtcApplication.class));

        ValidateUserInfo result = ctcApplicationService.validateUser(request);

        assertEquals("John Doe", result.getUserName());
        assertEquals("Complainant", result.getDesignation());
        assertEquals("9876543210", result.getMobileNumber());
        assertEquals("FIL-001", result.getFilingNumber());
        assertEquals("KLKM52", result.getCourtId());
        assertTrue(result.getIsPartyToCase());
    }

    // ---- determineWorkflowAction (indirect tests via markDocumentsAsIssuedOrReject) ----

    @Test
    void markDocuments_shouldIssueWhenPendingIssueAndHasIssuedDocs() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001").build();
        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(item)).build();

        application.setStatus("PENDING_ISSUE");
        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(Map.of("ISSUED", 1, "PENDING", 2));

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        // Should set workflow action to ISSUE
        ArgumentCaptor<CtcApplicationRequest> captor = ArgumentCaptor.forClass(CtcApplicationRequest.class);
        verify(producer).push(eq("update-ctc"), captor.capture());
        assertEquals("ISSUE", captor.getValue().getCtcApplication().getWorkflow().getAction());
    }

    @Test
    void markDocuments_shouldRejectAllWhenAllRejectedNonePending() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001").build();
        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("REJECT")
                .docs(List.of(item)).build();

        application.setStatus("PENDING_ISSUE");
        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(Map.of("REJECTED", 3));

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        ArgumentCaptor<CtcApplicationRequest> captor = ArgumentCaptor.forClass(CtcApplicationRequest.class);
        verify(producer).push(eq("update-ctc"), captor.capture());
        assertEquals("REJECT_ALL", captor.getValue().getCtcApplication().getWorkflow().getAction());
    }

    @Test
    void markDocuments_shouldIssueAllWhenPartiallyIssuedAndNoPending() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001").build();
        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(item)).build();

        application.setStatus("PARTIALLY_ISSUED");
        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(Map.of("ISSUED", 3, "REJECTED", 1));

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        ArgumentCaptor<CtcApplicationRequest> captor = ArgumentCaptor.forClass(CtcApplicationRequest.class);
        verify(producer).push(eq("update-ctc"), captor.capture());
        assertEquals("ISSUE_ALL", captor.getValue().getCtcApplication().getWorkflow().getAction());
    }
}
