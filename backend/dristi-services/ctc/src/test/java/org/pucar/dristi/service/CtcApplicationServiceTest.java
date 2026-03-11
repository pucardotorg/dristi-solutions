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
import org.pucar.dristi.util.*;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import org.pucar.dristi.validators.CtcApplicationValidator;
import org.pucar.dristi.web.models.*;

import java.io.IOException;
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
    @Mock private ESignUtil eSignUtil;
    @Mock private CipherUtil cipherUtil;
    @Mock private XmlRequestGenerator xmlRequestGenerator;
    @Mock private EgovPdfUtil egovPdfUtil;

    @Spy
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
        verify(indexerUtils, never()).updateTrackerStatus(anyString(), anyString());
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
        Document doc = Document.builder().fileStore("fs-signed-1").documentType("SIGNED").isActive(true).build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001")
                .documents(List.of(doc)).build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(item)).build();

        // fetchCtcApplication will try Redis first
        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        application.setStatus("PENDING_ISSUE");

        Map<String, Integer> statusCounts = Map.of("ISSUED", 1, "PENDING", 2);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(statusCounts);

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        verify(indexerUtils).updateDocStatus(eq("doc-1"), eq("CA-001"), eq("ISSUED"), eq(List.of(doc)));
        verify(indexerUtils).getDocStatusCounts("CA-001");
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldSetRejectStatusForRejectAction() throws Exception {
        Document doc = Document.builder().fileStore("fs-1").documentType("ORIGINAL").isActive(true).build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001")
                .documents(List.of(doc)).build();

        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("REJECT")
                .docs(List.of(item)).build();

        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
        application.setStatus("PENDING_ISSUE");

        Map<String, Integer> statusCounts = Map.of("REJECTED", 1, "PENDING", 1);
        when(indexerUtils.getDocStatusCounts("CA-001")).thenReturn(statusCounts);

        ctcApplicationService.markDocumentsAsIssuedOrReject(request);

        verify(indexerUtils).updateDocStatus(eq("doc-1"), eq("CA-001"), eq("REJECTED"), eq(List.of(doc)));
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldThrowWhenApplicationNotFound() {
        Document doc = Document.builder().fileStore("fs-1").build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-MISSING").filingNumber("FIL-001")
                .documents(List.of(doc)).build();

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
        Document doc = Document.builder().fileStore("fs-signed-1").documentType("SIGNED").isActive(true).build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001")
                .documents(List.of(doc)).build();
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
        Document doc = Document.builder().fileStore("fs-1").build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001")
                .documents(List.of(doc)).build();
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
        Document doc = Document.builder().fileStore("fs-signed-1").documentType("SIGNED").isActive(true).build();
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001")
                .documents(List.of(doc)).build();
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

    // ---- createDocsToSignRequest tests ----

//    @Test
//    void createDocsToSignRequest_shouldReturnDocsToSign() throws IOException {
//        DocsToSignCriteria criterion = DocsToSignCriteria.builder()
//                .fileStoreId("fs-original-1").tenantId("kl").docId("doc-1")
//                .ctcApplicationNumber("CA-001").filingNumber("FIL-001")
//                .placeholder("SIGN_HERE").build();
//
//        DocsToSignRequest request = DocsToSignRequest.builder()
//                .requestInfo(requestInfo)
//                .criteria(List.of(criterion)).build();
//
//        // Mock fetchCtcApplication for seal generation
//        when(cacheService.findById("ctc:CA-001")).thenReturn(application);
//        when(egovPdfUtil.getSealedTemplateFileStoreId(requestInfo, application)).thenReturn("fs-sealed-1");
//        when(fileStoreUtil.mergeFiles("fs-sealed-1", "fs-original-1", "kl")).thenReturn("fs-merged-1");
//
//        Coordinate coordinate = Coordinate.builder()
//                .fileStoreId("fs-merged-1").tenantId("kl")
//                .x(100.0f).y(200.0f).pageNumber(1).build();
//        when(eSignUtil.getCoordinateForSign(any(CoordinateRequest.class))).thenReturn(List.of(coordinate));
//
//        Resource mockResource = mock(Resource.class);
//        when(fileStoreUtil.fetchFileStoreObjectById("fs-merged-1", "kl")).thenReturn(mockResource);
//        when(cipherUtil.encodePdfToBase64(mockResource)).thenReturn("base64data");
//        when(config.getZoneId()).thenReturn("Asia/Kolkata");
//        when(config.getEsignSignatureWidth()).thenReturn(250);
//        when(config.getEsignSignatureHeight()).thenReturn(50);
//        when(xmlRequestGenerator.createXML(eq("request"), anyMap())).thenReturn("<xml>signRequest</xml>");
//
//        List<DocToSign> result = ctcApplicationService.createDocsToSignRequest(request);
//
//        assertEquals(1, result.size());
//        assertEquals("doc-1", result.get(0).getDocId());
//        assertEquals("CA-001", result.get(0).getCtcApplicationNumber());
//        assertEquals("FIL-001", result.get(0).getFilingNumber());
//        assertEquals("<xml>signRequest</xml>", result.get(0).getRequest());
//
//        verify(egovPdfUtil).getSealedTemplateFileStoreId(requestInfo, application);
//        verify(fileStoreUtil).mergeFiles("fs-sealed-1", "fs-original-1", "kl");
//        verify(eSignUtil).getCoordinateForSign(any(CoordinateRequest.class));
//    }

    @Test
    void createDocsToSignRequest_shouldFetchFromDbWhenCacheMiss() throws IOException {
        DocsToSignCriteria criterion = DocsToSignCriteria.builder()
                .fileStoreId("fs-1").tenantId("kl").docId("doc-1")
                .ctcApplicationNumber("CA-001").filingNumber("FIL-001")
                .placeholder("SIGN_HERE").build();

        DocsToSignRequest request = DocsToSignRequest.builder()
                .requestInfo(requestInfo)
                .criteria(List.of(criterion)).build();

        when(cacheService.findById("ctc:CA-001")).thenReturn(null);
        when(repository.getCtcApplication(any())).thenReturn(List.of(application));
        when(egovPdfUtil.getSealedTemplateFileStoreId(requestInfo, application)).thenReturn("fs-sealed-1");
        when(fileStoreUtil.mergeFiles(anyString(), anyString(), anyString())).thenReturn("fs-merged-1");

        Coordinate coordinate = Coordinate.builder()
                .fileStoreId("fs-merged-1").tenantId("kl")
                .x(50.0f).y(100.0f).pageNumber(1).build();
        when(eSignUtil.getCoordinateForSign(any(CoordinateRequest.class))).thenReturn(List.of(coordinate));

        Resource mockResource = mock(Resource.class);
        when(fileStoreUtil.fetchFileStoreObjectById("fs-merged-1", "kl")).thenReturn(mockResource);
        when(cipherUtil.encodePdfToBase64(mockResource)).thenReturn("base64data");
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
        when(config.getEsignSignatureWidth()).thenReturn(250);
        when(config.getEsignSignatureHeight()).thenReturn(50);
        when(xmlRequestGenerator.createXML(eq("request"), anyMap())).thenReturn("<xml/>");

        List<DocToSign> result = ctcApplicationService.createDocsToSignRequest(request);

        assertEquals(1, result.size());
        verify(repository).getCtcApplication(any());
    }

    // ---- updateDocsWithSignedCopy tests ----

    @Test
    void updateDocsWithSignedCopy_shouldDecodeStoreAndIssue() throws Exception {
        SignedDoc signedDoc = SignedDoc.builder()
                .docId("doc-1").signedDocData("base64SignedData").signed(true)
                .tenantId("kl").ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001").courtId("KLKM52").build();

        UpdateSignedDocsRequest request = UpdateSignedDocsRequest.builder()
                .requestInfo(requestInfo)
                .signedDocs(List.of(signedDoc)).build();

        MultipartFile mockFile = mock(MultipartFile.class);
        when(cipherUtil.decodeBase64ToPdf(eq("base64SignedData"), anyString())).thenReturn(mockFile);
        when(fileStoreUtil.storeFileInFileStore(mockFile, "kl")).thenReturn("fs-signed-new");

        // Stub markDocumentsAsIssuedOrReject to avoid deep dependency chain
        doNothing().when(ctcApplicationService).markDocumentsAsIssuedOrReject(any(IssueCtcDocumentUpdateRequest.class));

        ctcApplicationService.updateDocsWithSignedCopy(request);

        verify(cipherUtil).decodeBase64ToPdf(eq("base64SignedData"), anyString());
        verify(fileStoreUtil).storeFileInFileStore(mockFile, "kl");

        ArgumentCaptor<IssueCtcDocumentUpdateRequest> captor = ArgumentCaptor.forClass(IssueCtcDocumentUpdateRequest.class);
        verify(ctcApplicationService).markDocumentsAsIssuedOrReject(captor.capture());

        IssueCtcDocumentUpdateRequest capturedRequest = captor.getValue();
        assertEquals("ISSUE", capturedRequest.getAction());
        assertEquals("KLKM52", capturedRequest.getCourtId());
        assertEquals(1, capturedRequest.getDocs().size());
        assertEquals("doc-1", capturedRequest.getDocs().get(0).getDocId());
        assertEquals("CA-001", capturedRequest.getDocs().get(0).getCtcApplicationNumber());
        assertEquals("FIL-001", capturedRequest.getDocs().get(0).getFilingNumber());
        assertEquals("fs-signed-new", capturedRequest.getDocs().get(0).getDocuments().get(0).getFileStore());
    }

    @Test
    void updateDocsWithSignedCopy_shouldSkipUnsignedDocs() {
        SignedDoc unsignedDoc = SignedDoc.builder()
                .docId("doc-1").signed(false)
                .tenantId("kl").ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001").courtId("KLKM52").build();

        UpdateSignedDocsRequest request = UpdateSignedDocsRequest.builder()
                .requestInfo(requestInfo)
                .signedDocs(List.of(unsignedDoc)).build();

        ctcApplicationService.updateDocsWithSignedCopy(request);

        verifyNoInteractions(cipherUtil);
        verifyNoInteractions(fileStoreUtil);
    }

    @Test
    void updateDocsWithSignedCopy_shouldThrowOnDecodeError() throws IOException {
        SignedDoc signedDoc = SignedDoc.builder()
                .docId("doc-1").signedDocData("badData").signed(true)
                .tenantId("kl").ctcApplicationNumber("CA-001")
                .filingNumber("FIL-001").courtId("KLKM52").build();

        UpdateSignedDocsRequest request = UpdateSignedDocsRequest.builder()
                .requestInfo(requestInfo)
                .signedDocs(List.of(signedDoc)).build();

        when(cipherUtil.decodeBase64ToPdf(eq("badData"), anyString()))
                .thenThrow(new RuntimeException("decode error"));

        assertThrows(CustomException.class, () -> ctcApplicationService.updateDocsWithSignedCopy(request));
    }
}
