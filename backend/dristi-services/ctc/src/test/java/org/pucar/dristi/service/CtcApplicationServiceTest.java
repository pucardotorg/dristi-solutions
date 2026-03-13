package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.pucar.dristi.enrichment.CtcApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validators.CtcApplicationValidator;
import org.pucar.dristi.web.models.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtcApplicationServiceTest {

    @Mock private CtcApplicationRepository ctcApplicationRepository;
    @Mock private CtcApplicationEnrichment ctcApplicationEnrichment;
    @Mock private WorkflowService workflowService;
    @Mock private Configuration config;
    @Mock private Producer producer;
    @Mock private EtreasuryUtil etreasuryUtil;
    @Mock private FileStoreUtil fileStoreUtil;
    @Mock private IndexerUtils indexerUtils;
    @Mock private CtcApplicationValidator ctcApplicationValidator;
    @Mock private CacheService cacheService;
    @Mock private ObjectMapper objectMapper;
    @Mock private ESignUtil eSignUtil;
    @Mock private CipherUtil cipherUtil;
    @Mock private XmlRequestGenerator xmlRequestGenerator;
    @Mock private EgovPdfUtil egovPdfUtil;

    @InjectMocks
    private CtcApplicationService ctcApplicationService;

    private RequestInfo requestInfo;
    private CtcApplication application;
    private CtcApplicationRequest ctcApplicationRequest;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder()
                        .uuid("user-1")
                        .roles(new ArrayList<>(List.of(Role.builder().code("CITIZEN").tenantId("kl").build())))
                        .build())
                .build();

        application = CtcApplication.builder()
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
                .status("PENDING")
                .selectedCaseBundle(new ArrayList<>())
                .caseBundles(new ArrayList<>())
                .build();

        ctcApplicationRequest = CtcApplicationRequest.builder()
                .requestInfo(requestInfo)
                .ctcApplication(application)
                .build();
    }

    // ---- createApplication tests ----

    @Test
    void createApplication_shouldValidateEnrichAndPush() {
        when(config.getSaveCtcApplicationTopic()).thenReturn("save-topic");

        CtcApplication result = ctcApplicationService.createApplication(ctcApplicationRequest);

        verify(ctcApplicationValidator).validateCreateRequest(ctcApplicationRequest);
        verify(ctcApplicationEnrichment).enrichOnCreateCtcApplication(requestInfo, application);
        verify(workflowService).updateWorkflowStatus(application, requestInfo);
        verify(producer).push("save-topic", ctcApplicationRequest);
        verify(cacheService).saveInRedisCache(application);
        assertNotNull(result);
        assertNull(result.getCaseBundles());
    }

    // ---- updateApplication tests ----

    @Test
    void updateApplication_shouldValidateEnrichAndPush_noEsign() {
        application.setWorkflow(null);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        CtcApplication result = ctcApplicationService.updateApplication(ctcApplicationRequest);

        verify(ctcApplicationValidator).validateUpdateRequest(eq(ctcApplicationRequest), anyList());
        verify(ctcApplicationEnrichment).enrichOnUpdateCtcApplication(requestInfo, application);
        verify(workflowService).updateWorkflowStatus(application, requestInfo);
        verify(producer).push("update-topic", ctcApplicationRequest);
        verify(cacheService).saveInRedisCache(application);
        verify(etreasuryUtil, never()).createDemand(any(), any(), any());
        assertNotNull(result);
        assertNull(result.getCaseBundles());
    }

    @Test
    void updateApplication_withEsignAction_shouldCalculatePayment() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("ESIGN");
        application.setWorkflow(workflow);

        CaseBundleNode child = CaseBundleNode.builder().id("child-1").fileStoreId("fs-1").build();
        CaseBundleNode parent = CaseBundleNode.builder().id("parent-1").children(List.of(child)).build();
        application.setSelectedCaseBundle(new ArrayList<>(List.of(parent)));
        application.setIsPartyToCase(true);

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");
        when(config.getBreakDownCode()).thenReturn("BD-CODE");
        when(config.getBreakDownType()).thenReturn("BD-TYPE");
        when(fileStoreUtil.getTotalPageCount(eq("kl"), anyList())).thenReturn(10);

        CtcApplication result = ctcApplicationService.updateApplication(ctcApplicationRequest);

        assertEquals(10, application.getTotalPages());
        verify(etreasuryUtil).createDemand(eq(ctcApplicationRequest), eq("CA-001_CTC_APPLICATION_FEE"), any(Calculation.class));
        assertNotNull(result);
    }

    @Test
    void updateApplication_withUploadSignedCopyAction_shouldCalculatePayment() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("UPLOAD_SIGNED_COPY");
        application.setWorkflow(workflow);
        application.setSelectedCaseBundle(new ArrayList<>());

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");
        when(config.getBreakDownCode()).thenReturn("BD-CODE");
        when(config.getBreakDownType()).thenReturn("BD-TYPE");
        when(fileStoreUtil.getTotalPageCount(eq("kl"), anyList())).thenReturn(0);

        ctcApplicationService.updateApplication(ctcApplicationRequest);

        verify(etreasuryUtil).createDemand(eq(ctcApplicationRequest), eq("CA-001_CTC_APPLICATION_FEE"), any(Calculation.class));
    }

    @Test
    void updateApplication_notPartyToCase_shouldUseCaseBundleLookup() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("ESIGN");
        application.setWorkflow(workflow);
        application.setIsPartyToCase(false);

        CaseBundleNode bundleChild = CaseBundleNode.builder().id("doc-1").fileStoreId("fs-bundle-1").build();
        application.setCaseBundles(new ArrayList<>(List.of(
                CaseBundleNode.builder().id("bundle-parent").children(List.of(bundleChild)).build()
        )));

        CaseBundleNode selectedChild = CaseBundleNode.builder().id("doc-1").fileStoreId(null).build();
        application.setSelectedCaseBundle(new ArrayList<>(List.of(
                CaseBundleNode.builder().id("sel-parent").children(List.of(selectedChild)).build()
        )));

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");
        when(config.getBreakDownCode()).thenReturn("BD-CODE");
        when(config.getBreakDownType()).thenReturn("BD-TYPE");
        when(fileStoreUtil.getTotalPageCount(eq("kl"), anyList())).thenReturn(5);

        ctcApplicationService.updateApplication(ctcApplicationRequest);

        verify(fileStoreUtil).getTotalPageCount(eq("kl"), argThat(list -> list.contains("fs-bundle-1")));
    }

    @Test
    void updateApplication_shouldDeleteInactiveDocuments() {
        application.setWorkflow(null);
        Document activeDoc = Document.builder().fileStore("fs-active").isActive(true).documentType("other").build();
        Document inactiveDoc = Document.builder().fileStore("fs-inactive").isActive(false).documentType("other").build();
        application.setDocuments(new ArrayList<>(List.of(activeDoc, inactiveDoc)));

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        ctcApplicationService.updateApplication(ctcApplicationRequest);

        assertEquals(1, application.getDocuments().size());
        assertEquals("fs-active", application.getDocuments().get(0).getFileStore());
        verify(fileStoreUtil).deleteFilesByFileStore(anyList(), eq("kl"));
    }

    @Test
    void updateApplication_shouldRemoveMergedFileWhenFinalStatus() {
        application.setWorkflow(null);
        application.setStatus("ISSUED");
        Document mergedDoc = Document.builder().fileStore("fs-merged").isActive(true).documentType("merged_file").build();
        Document sealedDoc = Document.builder().fileStore("fs-sealed").isActive(true).documentType("sealed_file").build();
        Document normalDoc = Document.builder().fileStore("fs-normal").isActive(true).documentType("evidence").build();
        application.setDocuments(new ArrayList<>(List.of(mergedDoc, sealedDoc, normalDoc)));

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        ctcApplicationService.updateApplication(ctcApplicationRequest);

        assertEquals(1, application.getDocuments().size());
        assertEquals("evidence", application.getDocuments().get(0).getDocumentType());
    }

    // ---- searchApplications tests ----

    @Test
    void searchApplications_shouldReturnFromCache_whenCachedByNumber() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .ctcApplicationNumber("CA-001").build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(criteria).build();

        when(cacheService.searchRedisCache("CA-001")).thenReturn(application);

        List<CtcApplication> results = ctcApplicationService.searchApplications(searchRequest);

        assertEquals(1, results.size());
        assertEquals("CA-001", results.get(0).getCtcApplicationNumber());
        verify(ctcApplicationRepository, never()).getCtcApplication(any());
    }

    @Test
    void searchApplications_shouldQueryRepository_whenCacheEmpty() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .ctcApplicationNumber("CA-001").build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(criteria).build();

        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));

        List<CtcApplication> results = ctcApplicationService.searchApplications(searchRequest);

        assertEquals(1, results.size());
        verify(cacheService).saveInRedisCache(application);
    }

    @Test
    void searchApplications_shouldReturnEmptyList_whenRepositoryReturnsNull() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder().build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(criteria).build();

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(null);

        List<CtcApplication> results = ctcApplicationService.searchApplications(searchRequest);

        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void searchApplications_shouldEnrichCreatedByForCitizen() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder().build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(criteria).build();

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));

        ctcApplicationService.searchApplications(searchRequest);

        assertEquals("user-1", criteria.getCreatedBy());
    }

    @Test
    void searchApplications_shouldNotEnrichCreatedByForNonCitizen() {
        requestInfo.getUserInfo().setRoles(new ArrayList<>(List.of(
                Role.builder().code("JUDGE").tenantId("kl").build()
        )));
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder().build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(criteria).build();

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));

        ctcApplicationService.searchApplications(searchRequest);

        assertNull(criteria.getCreatedBy());
    }

    @Test
    void searchApplications_shouldStripCaseBundles() {
        application.setCaseBundles(List.of(CaseBundleNode.builder().id("cb-1").build()));
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder().build();
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(criteria).build();

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));

        List<CtcApplication> results = ctcApplicationService.searchApplications(searchRequest);

        assertNull(results.get(0).getCaseBundles());
    }

    // ---- fetchCtcApplication tests ----

    @Test
    void fetchCtcApplication_shouldReturnFromCache() {
        when(cacheService.searchRedisCache("CA-001")).thenReturn(application);

        CtcApplication result = ctcApplicationService.fetchCtcApplication("CA-001", "FIL-001", "KLKM52");

        assertEquals("CA-001", result.getCtcApplicationNumber());
        verify(ctcApplicationRepository, never()).getCtcApplication(any());
    }

    @Test
    void fetchCtcApplication_shouldFallbackToDb() {
        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));

        CtcApplication result = ctcApplicationService.fetchCtcApplication("CA-001", "FIL-001", "KLKM52");

        assertEquals("CA-001", result.getCtcApplicationNumber());
        verify(cacheService).saveInRedisCache(application);
    }

    @Test
    void fetchCtcApplication_shouldThrowWhenNotFound() {
        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(Collections.emptyList());

        assertThrows(CustomException.class,
                () -> ctcApplicationService.fetchCtcApplication("CA-001", "FIL-001", "KLKM52"));
    }

    @Test
    void fetchCtcApplication_shouldThrowWhenDbReturnsNull() {
        when(cacheService.searchRedisCache("CA-001")).thenReturn(null);
        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(null);

        assertThrows(CustomException.class,
                () -> ctcApplicationService.fetchCtcApplication("CA-001", "FIL-001", "KLKM52"));
    }

    // ---- validateUser tests ----

    @Test
    void validateUser_shouldReturnValidateUserInfo() {
        doAnswer(invocation -> {
            CtcApplication app = invocation.getArgument(1);
            app.setApplicantName("John");
            app.setPartyDesignation("Complainant");
            app.setIsPartyToCase(true);
            return null;
        }).when(ctcApplicationValidator).validateAndEnrichUser(any(), any());

        ValidateUserRequest request = ValidateUserRequest.builder()
                .requestInfo(requestInfo)
                .filingNumber("FIL-001")
                .courtId("KLKM52")
                .mobileNumber("9876543210")
                .build();

        ValidateUserInfo result = ctcApplicationService.validateUser(request);

        assertEquals("John", result.getUserName());
        assertEquals("Complainant", result.getDesignation());
        assertEquals("9876543210", result.getMobileNumber());
        assertEquals("FIL-001", result.getFilingNumber());
        assertEquals("KLKM52", result.getCourtId());
        assertTrue(result.getIsPartyToCase());
    }

    // ---- reviewApplications tests ----

    @Test
    void reviewApplications_shouldApproveApplication() {
        ReviewItem reviewItem = ReviewItem.builder()
                .ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001")
                .comments("Approved")
                .build();

        CtcApplicationReviewRequest reviewRequest = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo)
                .courtId("KLKM52")
                .action("APPROVE")
                .applications(List.of(reviewItem))
                .build();

        application.setSelectedCaseBundle(new ArrayList<>(List.of(
                CaseBundleNode.builder().id("cb-1").status("PENDING").build()
        )));

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        doAnswer(invocation -> {
            CtcApplication app = invocation.getArgument(0);
            app.setStatus("PENDING_ISSUE");
            return null;
        }).when(workflowService).updateWorkflowStatus(any(CtcApplication.class), any());

        List<CtcApplication> results = ctcApplicationService.reviewApplications(reviewRequest);

        assertEquals(1, results.size());
        assertEquals("Approved", results.get(0).getJudgeComments());
        verify(ctcApplicationEnrichment).enrichOnUpdateCtcApplication(requestInfo, application);
        verify(indexerUtils).pushIssueCtcDocumentsToIndex(application);
        verify(indexerUtils).updateTrackerStatus(eq("CA-001"), eq("APPROVED"), any());
        verify(producer).push(eq("update-topic"), any(CtcApplicationRequest.class));
    }

    @Test
    void reviewApplications_shouldRejectApplication() {
        ReviewItem reviewItem = ReviewItem.builder()
                .ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001")
                .comments("Rejected")
                .build();

        CtcApplicationReviewRequest reviewRequest = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo)
                .courtId("KLKM52")
                .action("REJECT")
                .applications(List.of(reviewItem))
                .build();

        CaseBundleNode node = CaseBundleNode.builder().id("cb-1").status("PENDING").build();
        application.setSelectedCaseBundle(new ArrayList<>(List.of(node)));

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(List.of(application));
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        doAnswer(invocation -> {
            CtcApplication app = invocation.getArgument(0);
            app.setStatus("REJECTED");
            return null;
        }).when(workflowService).updateWorkflowStatus(any(CtcApplication.class), any());

        List<CtcApplication> results = ctcApplicationService.reviewApplications(reviewRequest);

        assertEquals(1, results.size());
        assertEquals("REJECTED", results.get(0).getSelectedCaseBundle().get(0).getStatus());
        verify(indexerUtils).updateTrackerStatus(eq("CA-001"), eq("REJECTED"), isNull());
    }

    @Test
    void reviewApplications_shouldThrowWhenApplicationNotFound() {
        ReviewItem reviewItem = ReviewItem.builder()
                .ctcApplicationNumber("CA-MISSING")
                .filingNumber("FIL-001")
                .build();

        CtcApplicationReviewRequest reviewRequest = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo)
                .courtId("KLKM52")
                .action("APPROVE")
                .applications(List.of(reviewItem))
                .build();

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(Collections.emptyList());

        assertThrows(CustomException.class, () -> ctcApplicationService.reviewApplications(reviewRequest));
    }

    // ---- markDocumentsAsIssuedOrReject tests ----

    @Test
    void markDocumentsAsIssuedOrReject_shouldIssueDocument() throws Exception {
        Document doc = Document.builder().fileStore("fs-signed").documentType("SIGNED").isActive(true).build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1")
                .ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001")
                .documents(List.of(doc))
                .build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo)
                .courtId("KLKM52")
                .action("ISSUE")
                .docs(List.of(item))
                .build();

        CaseBundleNode childNode = CaseBundleNode.builder().id("doc-1").build();
        application.setSelectedCaseBundle(new ArrayList<>(List.of(
                CaseBundleNode.builder().id("parent-1").children(List.of(childNode)).build()
        )));
        application.setStatus("PENDING_ISSUE");

        Map<String, Integer> statusCounts = new HashMap<>();
        statusCounts.put("ISSUED", 0);
        statusCounts.put("REJECTED", 0);
        statusCounts.put("PENDING", 2);

        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(statusCounts);
        when(cacheService.searchRedisCache("CA-001")).thenReturn(application);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        verify(indexerUtils).updateDocStatus(eq("doc-1"), eq("CA-001"), eq("ISSUED"), eq(List.of(doc)));
        assertEquals("fs-signed", childNode.getIssuedFileStoreId());
        assertEquals("ACCEPTED", childNode.getStatus());
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldRejectDocument() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1")
                .ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001")
                .documents(Collections.emptyList())
                .build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo)
                .courtId("KLKM52")
                .action("REJECT")
                .docs(List.of(item))
                .build();

        CaseBundleNode childNode = CaseBundleNode.builder().id("doc-1").build();
        application.setSelectedCaseBundle(new ArrayList<>(List.of(
                CaseBundleNode.builder().id("parent-1").children(List.of(childNode)).build()
        )));
        application.setStatus("PENDING_ISSUE");

        Map<String, Integer> statusCounts = new HashMap<>();
        statusCounts.put("ISSUED", 0);
        statusCounts.put("REJECTED", 0);
        statusCounts.put("PENDING", 1);

        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(statusCounts);
        when(cacheService.searchRedisCache("CA-001")).thenReturn(application);
        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        verify(indexerUtils).updateDocStatus(eq("doc-1"), eq("CA-001"), eq("REJECTED"), anyList());
        assertEquals("REJECTED", childNode.getStatus());
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldThrowCustomExceptionOnIndexError() throws Exception {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1")
                .ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001")
                .build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo)
                .courtId("KLKM52")
                .action("ISSUE")
                .docs(List.of(item))
                .build();

        when(indexerUtils.getDocStatusCounts("CA-001")).thenThrow(new RuntimeException("ES error"));

        assertThrows(CustomException.class, () -> ctcApplicationService.markDocumentsAsIssuedOrReject(request));
    }

    // ---- updateApplication edge cases ----

    @Test
    void updateApplication_withEsign_nullSelectedCaseBundle_shouldHandleGracefully() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("ESIGN");
        application.setWorkflow(workflow);
        application.setSelectedCaseBundle(null);

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");
        when(config.getBreakDownCode()).thenReturn("BD-CODE");
        when(config.getBreakDownType()).thenReturn("BD-TYPE");
        when(fileStoreUtil.getTotalPageCount(eq("kl"), anyList())).thenReturn(0);

        assertDoesNotThrow(() -> ctcApplicationService.updateApplication(ctcApplicationRequest));
    }

    @Test
    void updateApplication_filterAndDeleteInactiveDocuments_noDocuments() {
        application.setWorkflow(null);
        application.setDocuments(null);

        when(config.getUpdateCtcApplicationTopic()).thenReturn("update-topic");

        assertDoesNotThrow(() -> ctcApplicationService.updateApplication(ctcApplicationRequest));
        verify(fileStoreUtil, never()).deleteFilesByFileStore(anyList(), anyString());
    }

    // ---- searchApplications with null criteria ----

    @Test
    void searchApplications_shouldHandleNullCriteria() {
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo).criteria(null).build();

        when(ctcApplicationRepository.getCtcApplication(any())).thenReturn(new ArrayList<>());

        List<CtcApplication> results = ctcApplicationService.searchApplications(searchRequest);

        assertNotNull(results);
        assertTrue(results.isEmpty());
    }
}
