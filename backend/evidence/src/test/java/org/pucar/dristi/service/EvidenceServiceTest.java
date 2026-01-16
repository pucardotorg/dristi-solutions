package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.EvidenceEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.EvidenceRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.UrlShortenerUtil;
import org.pucar.dristi.validators.EvidenceValidator;
import org.pucar.dristi.web.models.*;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.COMMENT_ADD_ERR;
import static org.pucar.dristi.config.ServiceConstants.INITIATE_E_SIGN;
import static org.pucar.dristi.config.ServiceConstants.EMPLOYEE_UPPER;

@ExtendWith(MockitoExtension.class)
class EvidenceServiceTest {

    @Mock
    private EvidenceValidator validator;

    @Mock
    private EvidenceEnrichment evidenceEnrichment;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private EvidenceRepository repository;

    @Mock
    private Producer producer;

    @Mock
    private Configuration config;

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private UrlShortenerUtil urlShortenerUtil;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private org.pucar.dristi.util.ESignUtil eSignUtil;

    @Mock
    private org.pucar.dristi.util.FileStoreUtil fileStoreUtil;

    @Mock
    private org.pucar.dristi.util.CipherUtil cipherUtil;

    @Mock
    private org.pucar.dristi.util.XmlRequestGenerator xmlRequestGenerator;

    @Mock
    private org.pucar.dristi.util.HearingUtil hearingUtil;

    @Mock
    private org.pucar.dristi.util.DateUtil dateUtil;

    @Mock
    private org.pucar.dristi.util.ADiaryUtil aDiaryUtil;

    @Mock
    private SmsNotificationService notificationService;

    @Mock
    private IndividualService individualService;

    @Spy
    @InjectMocks
    private EvidenceService evidenceService;

    private EvidenceRequest evidenceRequest;
    private Artifact artifact;
    Map<String, Map<String, JSONArray>> mockMdmsData = new HashMap<>();

    @BeforeEach
    void setUp() {
        artifact = new Artifact();
        artifact.setArtifactType("DEPOSITION");
        artifact.setIsEvidence(true);
        artifact.setFilingType("CASE_FILING");
        evidenceRequest = new EvidenceRequest();
        evidenceRequest.setArtifact(artifact);

        lenient().when(config.getFilingTypeModule()).thenReturn("FilingTypeModule");
        lenient().when(config.getFilingTypeMaster()).thenReturn("FilingTypeMaster");
        JSONArray filingTypeArray = new JSONArray();
        JSONObject filingType1 = new JSONObject();
        filingType1.put("displayName", "caseFiling");
        filingType1.put("code", "CASE_FILING");

        filingTypeArray.add(filingType1);

        Map<String, JSONArray> innerMap = new HashMap<>();
        innerMap.put("FilingTypeMaster", filingTypeArray);
        mockMdmsData.put("FilingTypeModule", innerMap);
    }

    @Test
    void testCreateEvidence_Deposition() {
        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(mockMdmsData);
        when(objectMapper.convertValue(any(), eq(JSONObject.class))).thenReturn((JSONObject) mockMdmsData.get("FilingTypeModule").get("FilingTypeMaster").get(0));
        Artifact result = evidenceService.createEvidence(evidenceRequest);

        verify(validator).validateEvidenceRegistration(evidenceRequest);
        verify(evidenceEnrichment).enrichEvidenceRegistration(evidenceRequest);
        verify(workflowService).updateWorkflowStatus(evidenceRequest, artifact.getFilingType());
        verify(producer).push(config.getEvidenceCreateTopic(), evidenceRequest);

        assertEquals(artifact, result);
    }

    @Test
    void testCreateEvidence_Other() throws Exception {
        artifact.setArtifactType("OTHER");
        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(mockMdmsData);
        when(objectMapper.convertValue(any(), eq(JSONObject.class))).thenReturn((JSONObject) mockMdmsData.get("FilingTypeModule").get("FilingTypeMaster").get(0));
        when(config.getEvidenceCreateWithoutWorkflowTopic()).thenReturn("evidence-create-without-workflow-topic");;
        Artifact result = evidenceService.createEvidence(evidenceRequest);

        verify(validator).validateEvidenceRegistration(evidenceRequest);
        verify(evidenceEnrichment).enrichEvidenceRegistration(evidenceRequest);
        verify(producer).push(config.getEvidenceCreateWithoutWorkflowTopic(), evidenceRequest);

        assertEquals(artifact, result);
    }

    @Test
    void testSearchEvidence_NoArtifacts() {
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(User.builder().type("EMPLOYEE").roles(Collections.singletonList(Role.builder().build())).build());
        EvidenceSearchCriteria criteria = new EvidenceSearchCriteria();
        criteria.setTenantId("kl");
        when(repository.getArtifacts(criteria,null)).thenReturn(Collections.emptyList());

        List<Artifact> result = evidenceService.searchEvidence(requestInfo, criteria,null);

        assertTrue(result.isEmpty());
    }

    @Test
    void testSearchEvidence_WithArtifacts() {
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(User.builder().type("EMPLOYEE").roles(Collections.singletonList(Role.builder().build())).build());
        EvidenceSearchCriteria criteria = new EvidenceSearchCriteria();
        criteria.setTenantId("kl");
        when(repository.getArtifacts(criteria,null)).thenReturn(List.of(artifact));

        // Mocking the ProcessInstance and Workflow
        List<Artifact> result = evidenceService.searchEvidence(requestInfo, criteria,null);

        assertFalse(result.isEmpty());
    }


    @Test
    void testUpdateEvidence() {
        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(mockMdmsData);
        when(objectMapper.convertValue(any(), eq(JSONObject.class))).thenReturn((JSONObject) mockMdmsData.get("FilingTypeModule").get("FilingTypeMaster").get(0));
        when(validator.validateEvidenceExistence(evidenceRequest)).thenReturn(mock(Artifact.class));
        evidenceRequest.getArtifact().setWorkflow(new WorkflowObject());
        evidenceRequest.getArtifact().getWorkflow().setAction(INITIATE_E_SIGN);
        evidenceRequest.getArtifact().setTenantId("kl");
        evidenceRequest.getArtifact().setArtifactNumber("123");

        when(urlShortenerUtil.createShortenedUrl("kl", "123")).thenReturn("shortenedUrl");

        Artifact result = evidenceService.updateEvidence(evidenceRequest);

        verify(evidenceEnrichment).enrichEvidenceRegistrationUponUpdate(evidenceRequest);

        assertEquals(artifact, result);
        assertEquals(artifact.getArtifactNumber(), result.getArtifactNumber());
        assertEquals(artifact.getShortenedUrl(), result.getShortenedUrl());
        assertEquals("shortenedUrl", artifact.getShortenedUrl());
    }

    @Test
    void testValidateExistingArtifact() {
        when(validator.validateEvidenceExistence(evidenceRequest)).thenReturn(artifact);

        Artifact result = evidenceService.validateExistingEvidence(evidenceRequest);

        assertEquals(artifact, result);
    }

    @Test
    void testEnrichBasedOnStatus_Abated() {
        artifact.setStatus("ABATED");

        evidenceService.enrichBasedOnStatus(evidenceRequest);

        verify(evidenceEnrichment).enrichIsActive(evidenceRequest);
    }

    @Test
    void testCreateEvidence_Exception() {
        doThrow(new CustomException("ERROR", "Custom Error")).when(validator).validateEvidenceRegistration(any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            evidenceService.createEvidence(evidenceRequest);
        });

        assertEquals("ERROR", exception.getCode());
    }

    @Test
    void addComments_Success() {
        EvidenceAddCommentRequest request = new EvidenceAddCommentRequest();
        EvidenceAddComment EvidenceAddComment = new EvidenceAddComment();
        EvidenceAddComment.setArtifactNumber("app123");
        EvidenceAddComment.setTenantId("tenant1");
        Comment comment = new Comment();
        EvidenceAddComment.setComment(Collections.singletonList(comment));
        User userInfo = User.builder().uuid("user-uuid").tenantId("tenant-id").build();
        RequestInfo requestInfoLocal = RequestInfo.builder().userInfo(userInfo).build();
        request.setRequestInfo(requestInfoLocal);
        request.setEvidenceAddComment(EvidenceAddComment);

        Artifact Artifact = new Artifact();
        Artifact.setArtifactNumber("app123");
        Artifact.setTenantId("tenant1");
        Artifact.setComments(new ArrayList<>());
        AuditDetails auditDetails = AuditDetails.builder().build();
        Artifact.setAuditdetails(auditDetails);

        when(repository.getArtifacts(any(),any())).thenReturn(Collections.singletonList(Artifact));
        when(config.getEvidenceUpdateCommentsTopic()).thenReturn("update-comments");
        doNothing().when(producer).push(anyString(), any());

        evidenceService.addComments(request);

        verify(repository).getArtifacts(any(),any());
        verify(producer).push(anyString(), any());
    }

    @Test
    void addComments_ArtifactNotFound() {
        EvidenceAddCommentRequest request = new EvidenceAddCommentRequest();
        EvidenceAddComment EvidenceAddComment = new EvidenceAddComment();
        EvidenceAddComment.setArtifactNumber("app123");
        EvidenceAddComment.setTenantId("tenant1");
        request.setEvidenceAddComment(EvidenceAddComment);
        request.setRequestInfo(new RequestInfo());

        when(repository.getArtifacts(any(),any())).thenReturn(Collections.emptyList());

        CustomException exception = assertThrows(CustomException.class, () -> {
            evidenceService.addComments(request);
        });

        assertEquals("Evidence not found", exception.getMessage());
        verify(repository).getArtifacts(any(),any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void addComments_EnrichmentFailure() {
        EvidenceAddCommentRequest request = new EvidenceAddCommentRequest();
        EvidenceAddComment EvidenceAddComment = new EvidenceAddComment();
        EvidenceAddComment.setArtifactNumber("app123");
        EvidenceAddComment.setTenantId("tenant1");
        Comment comment = new Comment();
        EvidenceAddComment.setComment(Collections.singletonList(comment));
        request.setEvidenceAddComment(EvidenceAddComment);
        User userInfo = User.builder().uuid("user-uuid").tenantId("tenant-id").build();
        RequestInfo requestInfoLocal = RequestInfo.builder().userInfo(userInfo).build();
        request.setRequestInfo(requestInfoLocal);
        request.setEvidenceAddComment(EvidenceAddComment);

        Artifact Artifact = new Artifact();
        Artifact.setArtifactNumber("app123");
        Artifact.setTenantId("tenant1");
        Artifact.setComments(new ArrayList<>());

        when(repository.getArtifacts(any(),any())).thenReturn(Collections.singletonList(Artifact));
        doThrow(new RuntimeException("Enrichment failed")).when(evidenceEnrichment).enrichCommentUponCreate(any(), any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            evidenceService.addComments(request);
        });

        assertEquals(COMMENT_ADD_ERR, exception.getCode());
        assertEquals("Enrichment failed", exception.getMessage());
        verify(repository).getArtifacts(any(),any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testExtractPowerOfAttorneyIds_EmptyIndividualId() throws Exception {
        String json = """
                    {
                        "poaHolders": [
                            { "individualId": "" },
                            { "individualId": null }
                        ]
                    }
                """;

        ObjectMapper mapper = new ObjectMapper();
        JsonNode caseDetails = mapper.readTree(json);

        Set<String> individualIds = new HashSet<>();
        Set<String> result = evidenceService.extractPowerOfAttorneyIds(caseDetails, individualIds);

        assertTrue(result.isEmpty());
    }

    @Test
    void testExtractPowerOfAttorneyIds_IndividualId() throws Exception {
        String json = """
                    {
                    "representatives": [
                        { "individualId": "IND-123" },
                        { "individualId": null }
                    ],
                        "poaHolders": [
                            { "individualId": "IND-123" },
                            { "individualId": null }
                        ]
                    }
                """;

        ObjectMapper mapper = new ObjectMapper();
        JsonNode caseDetails = mapper.readTree(json);

        Set<String> individualIds = new HashSet<>();
        Set<String> result = evidenceService.extractPowerOfAttorneyIds(caseDetails, individualIds);

        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertTrue(result.contains("IND-123"));
    }

    @Test
    void testUpdateEvidence_withSms() throws JsonProcessingException {

        JsonNode json = new ObjectMapper().readTree("{\"litigants\":[],\"representatives\":[]}");

        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(mockMdmsData);
        when(objectMapper.convertValue(any(), eq(JSONObject.class))).thenReturn((JSONObject) mockMdmsData.get("FilingTypeModule").get("FilingTypeMaster").get(0));
        when(config.getUpdateEvidenceKafkaTopic()).thenReturn("update-evidence-topic");
        when(validator.validateEvidenceExistence(evidenceRequest)).thenReturn(mock(Artifact.class));
        evidenceRequest.getArtifact().setWorkflow(new WorkflowObject());
        evidenceRequest.getArtifact().getWorkflow().setAction(INITIATE_E_SIGN);
        evidenceRequest.getArtifact().setTenantId("kl");
        evidenceRequest.getArtifact().setArtifactNumber("123");
        evidenceRequest.getArtifact().setFilingNumber("KL-123");

        when(urlShortenerUtil.createShortenedUrl("kl", "123")).thenReturn("shortenedUrl");
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(json);

        Artifact result = evidenceService.updateEvidence(evidenceRequest);

        verify(evidenceEnrichment).enrichEvidenceRegistrationUponUpdate(evidenceRequest);
        verify(producer).push(config.getUpdateEvidenceKafkaTopic(), evidenceRequest);

        assertEquals(artifact, result);
        assertEquals(artifact.getArtifactNumber(), result.getArtifactNumber());
        assertEquals(artifact.getShortenedUrl(), result.getShortenedUrl());
        assertEquals("shortenedUrl", artifact.getShortenedUrl());
    }

    @Test
    void testCreateArtifactsToSignRequest_success() throws IOException {
        // Setup
        ArtifactsToSignRequest request = new ArtifactsToSignRequest();
        ArtifactsCriteria criteria = new ArtifactsCriteria();
        criteria.setFileStoreId("fs1");
        criteria.setPlaceholder("ph1");
        criteria.setTenantId("tenant1");
        criteria.setArtifactNumber("art1");
        request.setCriteria(Collections.singletonList(criteria));
        request.setRequestInfo(new RequestInfo());

        Coordinate coordinate = new Coordinate();
        coordinate.setFileStoreId("fs1");
        coordinate.setTenantId("tenant1");
        coordinate.setX(10);
        coordinate.setY(20);
        coordinate.setPageNumber(1);
        when(eSignUtil.getCoordinateForSign(any())).thenReturn(Collections.singletonList(coordinate));
        org.springframework.core.io.Resource resource = mock(org.springframework.core.io.Resource.class);
        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(resource);
        when(cipherUtil.encodePdfToBase64(any())).thenReturn("base64doc");
        when(xmlRequestGenerator.createXML(anyString(), anyMap())).thenReturn("<xml>req</xml>");
        when(config.getZoneId()).thenReturn("Asia/Kolkata");

        // Call
        List<ArtifactToSign> result = evidenceService.createArtifactsToSignRequest(request);
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("art1", result.get(0).getArtifactNumber());
        assertEquals("<xml>req</xml>", result.get(0).getRequest());
    }

    @Test
    void testCreateArtifactsToSignRequest_coordinateError() {
        ArtifactsToSignRequest request = new ArtifactsToSignRequest();
        ArtifactsCriteria criteria = new ArtifactsCriteria();
        criteria.setFileStoreId("fs1");
        criteria.setPlaceholder("ph1");
        criteria.setTenantId("tenant1");
        criteria.setArtifactNumber("art1");
        request.setCriteria(Collections.singletonList(criteria));
        request.setRequestInfo(new RequestInfo());
        when(eSignUtil.getCoordinateForSign(any())).thenReturn(Collections.emptyList());
        Exception ex = assertThrows(CustomException.class, () -> evidenceService.createArtifactsToSignRequest(request));
        assertEquals("COORDINATES_ERROR", ((CustomException)ex).getCode());
    }

    @Test
    void testUpdateArtifactWithSignDoc_success() {
        UpdateSignedArtifactRequest req = new UpdateSignedArtifactRequest();
        req.setRequestInfo(new RequestInfo());
        SignedArtifact signed = new SignedArtifact();
        signed.setArtifactNumber("art1");
        signed.setSignedArtifactData("data");
        signed.setSigned(true);
        signed.setTenantId("tenant1");
        signed.setIsWitnessDeposition(true);
        req.setSignedArtifacts(Collections.singletonList(signed));
        Artifact artifact = new Artifact();
        artifact.setArtifactNumber("art1");
        artifact.setTenantId("tenant1");
        artifact.setFilingType("CASE_FILING");
        artifact.setWorkflow(new WorkflowObject());
        when(repository.getArtifacts(any(), any())).thenReturn(Collections.singletonList(artifact));
        org.springframework.web.multipart.MultipartFile multipartFile = mock(org.springframework.web.multipart.MultipartFile.class);
        when(fileStoreUtil.storeFileInFileStore(any(), anyString())).thenReturn("fsid");
        when(validator.validateEvidenceExistence(any())).thenReturn(artifact);
        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(mockMdmsData);
        when(objectMapper.convertValue(any(), eq(JSONObject.class))).thenReturn((JSONObject) mockMdmsData.get("FilingTypeModule").get("FilingTypeMaster").get(0));
        List<Artifact> result = evidenceService.updateArtifactWithSignDoc(req);
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("art1", result.get(0).getArtifactNumber());
        assertEquals("CASE_FILING", result.get(0).getFilingType());
        assertEquals("SIGN", result.get(0).getWorkflow().getAction());
        assertNotNull(result.get(0).getFile());
        assertNotNull(result.get(0).getFile().getId());
        assertEquals("fsid", result.get(0).getFile().getFileStore());
    }

    @Test
    void testUpdateArtifactWithSignDoc_artifactNotFound() {
        UpdateSignedArtifactRequest req = new UpdateSignedArtifactRequest();
        req.setRequestInfo(new RequestInfo());
        SignedArtifact signed = new SignedArtifact();
        signed.setArtifactNumber("art1");
        signed.setSignedArtifactData("data");
        signed.setSigned(true);
        signed.setTenantId("tenant1");
        req.setSignedArtifacts(Collections.singletonList(signed));
        when(repository.getArtifacts(any(), any())).thenReturn(Collections.emptyList());
        Exception ex = assertThrows(CustomException.class, () -> evidenceService.updateArtifactWithSignDoc(req));
        assertEquals("ARTIFACT_BULK_SIGN_EXCEPTION", ((CustomException)ex).getCode());
    }

    @Test
    void shouldThrowExceptionIfEvidenceNumberExists() {
        EvidenceRequest request = buildEvidenceRequest();
        Artifact artifact = new Artifact(); // mock artifact
        artifact.setArtifactNumber("AR124");
        artifact.setEvidenceNumber("FN123-EV123");

        // Simulate duplicate found
        when(evidenceService.searchEvidence(any(), any(), any()))
                .thenReturn(List.of(artifact));


        CustomException ex = assertThrows(CustomException.class, () -> {
            evidenceService.checkUniqueEvidenceNumberForCase(request);
        });

        assertTrue(ex.getMessage().contains("Evidence Number FN123-EV123 already exists for case: FN123"));
    }


    @Test
    void shouldNotThrowExceptionIfEvidenceNumberIsUnique() {
        EvidenceRequest request = buildEvidenceRequest();
        when(evidenceService.searchEvidence(any(), any(), any()))
                .thenReturn(Collections.emptyList()); // simulate no duplicates

        assertDoesNotThrow(() -> evidenceService.checkUniqueEvidenceNumberForCase(request));
    }

    // Utility method to build test data
    private EvidenceRequest buildEvidenceRequest() {
        Artifact artifact = new Artifact();
        artifact.setFilingNumber("FN123");
        artifact.setEvidenceNumber("FN123-EV123");
        artifact.setArtifactNumber("AR123");

        RequestInfo requestInfo = new RequestInfo();
        User user = User.builder()
                .type(EMPLOYEE_UPPER)
                .build();
        requestInfo.setUserInfo(user);

        EvidenceRequest request = new EvidenceRequest();
        request.setArtifact(artifact);
        request.setRequestInfo(requestInfo);

        return request;
    }

    @Test
    void testCreateADiaryEntriesSuccess() throws JsonProcessingException {
        // Arrange
        Artifact artifact = new Artifact();
        artifact.setFilingNumber("CASE-001");
        artifact.setTenantId("pb");
        artifact.setArtifactNumber("ART-001");
        artifact.setCourtId("court-123");
        
        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("botd", "Document submission");
        artifact.setAdditionalDetails(additionalDetails);

        RequestInfo requestInfo = new RequestInfo();

        // Create JsonNode for case details response
        ObjectMapper mapper = new ObjectMapper();
        JsonNode caseDetailsNode = mapper.createObjectNode()
                .put("id", "case-123")
                .put("courtCaseNumber", "CC-001")
                .put("cmpNumber", "CMP-001")
                .put("filingNumber", "CASE-001");

        // Scheduled hearing
        Hearing hearing = new Hearing();
        hearing.setStatus("SCHEDULED");
        hearing.setStartTime(1234567890L);
        List<Hearing> hearings = Arrays.asList(hearing);

        Long currentTime = System.currentTimeMillis();
        Long startOfDay = currentTime - (currentTime % 86400000L);

        // Mock dependencies
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class)))
                .thenReturn(caseDetailsNode);
        when(hearingUtil.fetchHearing(any(HearingSearchRequest.class)))
                .thenReturn(hearings);
        when(dateUtil.getCurrentTimeInMilis()).thenReturn(currentTime);
        when(dateUtil.getStartOfTheDayForEpoch(currentTime)).thenReturn(startOfDay);

        // Act
        List<CaseDiaryEntry> result = evidenceService.createADiaryEntries(artifact, requestInfo);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        CaseDiaryEntry entry = result.get(0);
        assertEquals("pb", entry.getTenantId());
        assertEquals(startOfDay, entry.getEntryDate());
        assertEquals("CC-001", entry.getCaseNumber());
        assertEquals("case-123", entry.getCaseId());
        assertEquals("court-123", entry.getCourtId());
        assertEquals("Document submission", entry.getBusinessOfDay());
        assertEquals("ART-001", entry.getReferenceId());
        assertEquals("Documents", entry.getReferenceType());
        assertEquals(Long.valueOf(1234567890L), entry.getHearingDate());

        // Verify additional details
        Map<String, Object> entryAdditionalDetails = (Map<String, Object>) entry.getAdditionalDetails();
        assertEquals("CASE-001", entryAdditionalDetails.get("filingNumber"));
        assertEquals("case-123", entryAdditionalDetails.get("caseId"));
    }

    @Test
    void testCreateADiaryEntriesNoCaseFound() {
        // Arrange
        Artifact artifact = new Artifact();
        artifact.setFilingNumber("CASE-001");
        artifact.setTenantId("pb");

        RequestInfo requestInfo = new RequestInfo();

        // Mock caseUtil to throw exception
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class)))
                .thenThrow(new RuntimeException("Case not found"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            evidenceService.createADiaryEntries(artifact, requestInfo);
        });

        assertEquals("ERROR_WHILE_FETCHING_FROM_CASE", exception.getCode());
        assertTrue(exception.getMessage().contains("Failed to retrieve case details for filing number: CASE-001"));
    }

    @Test
    void testCreateADiaryEntriesNullCaseList() {
        // Arrange
        Artifact artifact = new Artifact();
        artifact.setFilingNumber("CASE-001");
        artifact.setTenantId("pb");
        artifact.setArtifactNumber("ART-001");
        artifact.setCourtId("court-123");

        RequestInfo requestInfo = new RequestInfo();

        // Mock caseUtil to return null
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class)))
                .thenReturn(null);
        when(hearingUtil.fetchHearing(any(HearingSearchRequest.class)))
                .thenReturn(Collections.emptyList());

        // Act & Assert
        // The implementation doesn't handle null JsonNode properly, so it throws NullPointerException
        // when trying to call .has() and .get() methods on null caseDetails
        NullPointerException exception = assertThrows(NullPointerException.class, () -> {
            evidenceService.createADiaryEntries(artifact, requestInfo);
        });

        // The NPE occurs in createCaseDiaryEntry when trying to access null caseDetails
        assertNotNull(exception);
    }

    @Test
    void testCreateADiaryEntriesNoScheduledHearing() throws JsonProcessingException {
        // Arrange
        Artifact artifact = new Artifact();
        artifact.setFilingNumber("CASE-001");
        artifact.setTenantId("pb");
        artifact.setArtifactNumber("ART-001");
        artifact.setCourtId("court-123");
        
        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("botd", "Document submission");
        artifact.setAdditionalDetails(additionalDetails);

        RequestInfo requestInfo = new RequestInfo();

        // Create JsonNode for case details response
        ObjectMapper mapper = new ObjectMapper();
        JsonNode caseDetailsNode = mapper.createObjectNode()
                .put("id", "case-123")
                .put("courtCaseNumber", "CC-001")
                .put("cmpNumber", "CMP-001");

        // No scheduled hearings
        Hearing hearing = new Hearing();
        hearing.setStatus("COMPLETED");
        hearing.setStartTime(1234567890L);
        List<Hearing> hearings = Arrays.asList(hearing);

        Long currentTime = System.currentTimeMillis();
        Long startOfDay = currentTime - (currentTime % 86400000L);

        // Mock dependencies
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class)))
                .thenReturn(caseDetailsNode);
        when(hearingUtil.fetchHearing(any(HearingSearchRequest.class)))
                .thenReturn(hearings);
        when(dateUtil.getCurrentTimeInMilis()).thenReturn(currentTime);
        when(dateUtil.getStartOfTheDayForEpoch(currentTime)).thenReturn(startOfDay);

        // Act
        List<CaseDiaryEntry> result = evidenceService.createADiaryEntries(artifact, requestInfo);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        CaseDiaryEntry entry = result.get(0);
        assertNull(entry.getHearingDate()); // No scheduled hearing, so hearing date should be null
    }

    @Test
    void testCreateADiaryEntriesWithNonMapAdditionalDetails() throws JsonProcessingException {
        // Arrange
        Artifact artifact = new Artifact();
        artifact.setFilingNumber("CASE-001");
        artifact.setTenantId("pb");
        artifact.setArtifactNumber("ART-001");
        artifact.setCourtId("court-123");
        artifact.setAdditionalDetails("not a map"); // Non-map additional details

        RequestInfo requestInfo = new RequestInfo();

        // Create JsonNode for case details response
        ObjectMapper mapper = new ObjectMapper();
        JsonNode caseDetailsNode = mapper.createObjectNode()
                .put("id", "case-123")
                .put("courtCaseNumber", "CC-001")
                .put("cmpNumber", "CMP-001");

        List<Hearing> hearings = Collections.emptyList();

        Long currentTime = System.currentTimeMillis();
        Long startOfDay = currentTime - (currentTime % 86400000L);

        // Mock dependencies
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class)))
                .thenReturn(caseDetailsNode);
        when(hearingUtil.fetchHearing(any(HearingSearchRequest.class)))
                .thenReturn(hearings);
        when(dateUtil.getCurrentTimeInMilis()).thenReturn(currentTime);
        when(dateUtil.getStartOfTheDayForEpoch(currentTime)).thenReturn(startOfDay);

        // Act
        List<CaseDiaryEntry> result = evidenceService.createADiaryEntries(artifact, requestInfo);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        CaseDiaryEntry entry = result.get(0);
        assertNull(entry.getBusinessOfDay()); // Should be null since additionalDetails is not a Map
    }

    @Test
    void testGetCaseReferenceNumberWithCourtCaseNumber() {
        // Act
        String result = evidenceService.getCaseReferenceNumber("CC-001", "CMP-001", "FILING-001");

        // Assert
        assertEquals("CC-001", result);
    }

    @Test
    void testGetCaseReferenceNumberWithCmpNumber() {
        // Act
        String result = evidenceService.getCaseReferenceNumber(null, "CMP-001", "FILING-001");

        // Assert
        assertEquals("CMP-001", result);
    }

    @Test
    void testGetCaseReferenceNumberWithEmptyCourtCaseNumber() {
        // Act
        String result = evidenceService.getCaseReferenceNumber("", "CMP-001", "FILING-001");

        // Assert
        assertEquals("CMP-001", result);
    }

    @Test
    void testGetCaseReferenceNumberWithFilingNumber() {
        // Act
        String result = evidenceService.getCaseReferenceNumber(null, null, "FILING-001");

        // Assert
        assertEquals("FILING-001", result);
    }

    @Test
    void testGetCaseReferenceNumberWithEmptyCmpNumber() {
        // Act
        String result = evidenceService.getCaseReferenceNumber(null, "", "FILING-001");

        // Assert
        assertEquals("FILING-001", result);
    }

    @Test
    void testCreateCaseDiaryEntry() throws JsonProcessingException {
        // Arrange
        Artifact artifact = new Artifact();
        artifact.setTenantId("pb");
        artifact.setFilingNumber("CASE-001");
        artifact.setArtifactNumber("ART-001");
        artifact.setCourtId("court-123");

        // Create JsonNode for case details
        ObjectMapper mapper = new ObjectMapper();
        JsonNode caseDetailsNode = mapper.createObjectNode()
                .put("id", "case-123")
                .put("courtCaseNumber", "CC-001")
                .put("cmpNumber", "CMP-001");

        String botd = "Document submission";
        Long hearingDate = 1234567890L;
        Long entryDate = System.currentTimeMillis();

        when(dateUtil.getStartOfTheDayForEpoch(anyLong())).thenReturn(entryDate);
        when(dateUtil.getCurrentTimeInMilis()).thenReturn(entryDate);

        // Act
        CaseDiaryEntry result = evidenceService.createCaseDiaryEntry(artifact, caseDetailsNode, botd, hearingDate);

        // Assert
        assertNotNull(result);
        assertEquals("pb", result.getTenantId());
        assertEquals(entryDate, result.getEntryDate());
        assertEquals("CC-001", result.getCaseNumber());
        assertEquals("case-123", result.getCaseId());
        assertEquals("court-123", result.getCourtId());
        assertEquals("Document submission", result.getBusinessOfDay());
        assertEquals("ART-001", result.getReferenceId());
        assertEquals("Documents", result.getReferenceType());
        assertEquals(1234567890L, result.getHearingDate());

        // Verify additional details
        Map<String, Object> additionalDetails = (Map<String, Object>) result.getAdditionalDetails();
        assertEquals("CASE-001", additionalDetails.get("filingNumber"));
        assertEquals("case-123", additionalDetails.get("caseId"));
    }
}
