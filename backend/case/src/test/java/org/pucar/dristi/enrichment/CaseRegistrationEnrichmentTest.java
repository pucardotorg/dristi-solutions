package org.pucar.dristi.enrichment;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import static org.pucar.dristi.config.ServiceConstants.ADMIT_CASE_WORKFLOW_ACTION;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import net.minidev.json.JSONArray;

import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.util.MdmsUtil;

@ExtendWith(MockitoExtension.class)
class CaseRegistrationEnrichmentTest {

    @Mock
    private IdgenUtil idgenUtil;
    @Mock
    private CaseUtil caseUtil;
    @Mock
    private Configuration config;
    @Mock
    private MdmsUtil mdmsUtil;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CaseRegistrationEnrichment caseRegistrationEnrichment;

    private CaseRequest caseRequest;
    private CourtCase courtCase;
    private RequestInfo requestInfo;
    private User userInfo;

    @BeforeEach
    void setUp() {
        // Initialize RequestInfo with necessary user info
        requestInfo = new RequestInfo();
        userInfo = new User();
        userInfo.setUuid("user-uuid");
        requestInfo.setUserInfo(userInfo);

        Document document = new Document();
        document.setDocumentType("documentType");
        document.setFileStore("fileStore");
        List<Document> documentsList = new ArrayList<>();
        documentsList.add(document);

        // Create case-indexer.yml CaseRequest with case-indexer.yml single CourtCase
        caseRequest = new CaseRequest();
        courtCase = new CourtCase();
        courtCase.setTenantId("tenant-id");
        List<LinkedCase> linkedCases = new ArrayList<>();
        linkedCases.add(LinkedCase.builder().caseNumber("caseNumber").documents(documentsList).build());
        courtCase.setLinkedCases(linkedCases);

        List<Party> listLitigants = new ArrayList<>();
        listLitigants.add(Party.builder().partyCategory("ctaegory1").documents(documentsList).build());
        listLitigants.add(Party.builder().tenantId("pg").partyCategory("ctaegory2").documents(documentsList).build());
        courtCase.setLitigants(listLitigants);

        List<AdvocateMapping> advocateMappingList = new ArrayList<>();
        List<Party> representingList = new ArrayList<>();
        representingList.add(Party.builder().tenantId("pg").documents(documentsList).build());
        advocateMappingList.add(AdvocateMapping.builder().tenantId("pg").representing(representingList).documents(documentsList).build());
        courtCase.setRepresentatives(advocateMappingList);

        List<StatuteSection> statuteSectionList = new ArrayList<>();
        List<String> sections = new ArrayList<>();
        sections.add("section1");
        sections.add("section2");
        List<String> subSections = new ArrayList<>();
        subSections.add("subsection1");
        subSections.add("subsection2");
        statuteSectionList.add(StatuteSection.builder().tenantId("pg").sections(sections).subsections(subSections).build());
        courtCase.setStatutesAndSections(statuteSectionList);

        documentsList.add(Document.builder().fileStore("fileStore").build());
        courtCase.setDocuments(documentsList);
        caseRequest.setCases(courtCase);

        // Set the request info in the case request
        caseRequest.setRequestInfo(requestInfo);
    }

    @Test
    void testEnrichCaseRegistration() {
// Setup mocks
        List<String> idList = Collections.singletonList("fillingNumberId");
        doReturn(idList).when(idgenUtil).getIdList(any(RequestInfo.class), eq("tenantId"), any(), isNull(), eq(1),any());
        courtCase = new CourtCase();
        courtCase.setTenantId("tenantId");

        requestInfo = new RequestInfo();
        User user = new User();
        user.setUuid("user-uuid");
        requestInfo.setUserInfo(user);
        caseRequest.setRequestInfo(requestInfo);
        caseRequest.setCases(courtCase);
        // Call the method under test
        caseRegistrationEnrichment.enrichCaseRegistrationOnCreate(caseRequest);
        // Verify the method behavior
        verify(idgenUtil).getIdList(any(RequestInfo.class), eq("tenantId"), any(), isNull(), eq(1),any());
        assertNotNull(courtCase.getAuditdetails());
        assertNotNull(courtCase.getId());
        assertNotNull(courtCase.getFilingNumber());
        assertNotNull(courtCase.getAuditdetails().getCreatedBy());
        assertNotNull(courtCase.getAuditdetails().getCreatedTime());
        assertNotNull(courtCase.getAuditdetails().getLastModifiedBy());
        assertNotNull(courtCase.getAuditdetails().getLastModifiedTime());
    }
    @Test
    void enrichCaseRegistration_OnCreate_ShouldThrowCustomException_WhenErrorOccurs() {

        when(idgenUtil.getIdList(any(), anyString(), anyString(), any(), anyInt(),any())).thenThrow(new RuntimeException("Error"));

        // Invoke the method and assert that it throws CustomException
        assertThrows(Exception.class, () -> caseRegistrationEnrichment.enrichCaseRegistrationOnCreate(caseRequest));
    }

    @Test
    void enrichCaseApplicationUponUpdate_ShouldEnrichAuditDetails() {
        userInfo.setUuid("user123");
        courtCase.setId(UUID.randomUUID());
        courtCase.setAuditdetails(new AuditDetails());
        String oldLastModifiedBy = "oldUser";
        courtCase.getAuditdetails().setLastModifiedBy(oldLastModifiedBy);
        Long oldLastModifiedTime = 123456789L;
        courtCase.getAuditdetails().setLastModifiedTime(oldLastModifiedTime);

        // Invoke the method
        caseRegistrationEnrichment.enrichCaseApplicationUponUpdate(caseRequest,Collections.singletonList(new CourtCase()));

        // Assert the enriched audit details
        assertNotEquals(oldLastModifiedTime, courtCase.getAuditdetails().getLastModifiedTime());
        assertNotEquals(oldLastModifiedBy, courtCase.getAuditdetails().getLastModifiedBy());
        assertEquals("user123", courtCase.getAuditdetails().getLastModifiedBy());
    }

    @Test
    void enrichCaseApplicationUponUpdate_ShouldEnrichAuditDetailsException() {
        caseRequest.setCases(null);

        assertThrows(Exception.class, () -> caseRegistrationEnrichment.enrichCaseRegistrationOnCreate(caseRequest));
    }

    @Test
    void enrichCaseApplicationUponUpdate_Exception() {
        caseRequest.setCases(null);

        assertThrows(Exception.class, () -> caseRegistrationEnrichment.enrichCaseApplicationUponUpdate(caseRequest, new ArrayList<>()));
    }

    @Test
    void enrichAccessCode_generatesAccessCode() {
        caseRequest.setCases(new CourtCase());
        caseRegistrationEnrichment.enrichAccessCode(caseRequest);

        assertNotNull(caseRequest.getCases().getAccessCode());
    }

    @Test
    void enrichAccessCode_generatesUniqueAccessCodes() {
        CaseRequest caseRequest1 = new CaseRequest();
        CaseRequest caseRequest2 = new CaseRequest();
        caseRequest1.setCases(new CourtCase());
        caseRequest2.setCases(new CourtCase());

        caseRegistrationEnrichment.enrichAccessCode(caseRequest1);
        caseRegistrationEnrichment.enrichAccessCode(caseRequest2);

        assertNotEquals(caseRequest1.getCases().getAccessCode(), caseRequest2.getCases().getAccessCode());
    }

    @Test
    void listToString_returnsEmptyStringForEmptyList() {
        List<String> emptyList = new ArrayList<>();
        String result = caseRegistrationEnrichment.listToString(emptyList);
        assertEquals("", result);
    }

    @Test
    void listToString_returnsSingleElementForSingleItemList() {
        List<String> singleItemList = Collections.singletonList("item1");
        String result = caseRegistrationEnrichment.listToString(singleItemList);
        assertEquals("item1", result);
    }

    @Test
    void listToString_returnsCommaSeparatedStringForMultipleItemList() {
        List<String> multipleItemList = Arrays.asList("item1", "item2", "item3");
        String result = caseRegistrationEnrichment.listToString(multipleItemList);
        assertEquals("item1,item2,item3", result);
    }

    @Test
    void listToString_handlesNullList() {
        List<String> nullList = null;
        assertThrows(NullPointerException.class, () -> caseRegistrationEnrichment.listToString(nullList));
    }

    @Test
    void enrichCaseNumberAndCourtCaseNumber_generatesCaseNumberAndCourtCaseNumber() {
        CourtCase courtCase = new CourtCase();
        courtCase.setFilingNumber("2022-12345");
        courtCase.setCourtId("KLKM52");
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(ADMIT_CASE_WORKFLOW_ACTION);
        courtCase.setWorkflow(workflow);
        caseRequest.setCases(courtCase);
        when(idgenUtil.getIdList(any(), any(), any(), any(), any(),any())).thenReturn(Collections.singletonList("12345"));
        caseRegistrationEnrichment.enrichCourtCaseNumber(caseRequest);

        assertNotNull(caseRequest.getCases().getCourtCaseNumber());
    }

    @Test
    void enrichCaseNumberAndCNRNumber_handlesException() {
        caseRequest.setCases(null);

        assertThrows(CustomException.class, () -> caseRegistrationEnrichment.enrichCourtCaseNumber(caseRequest));
    }

    @Test
    void enrichAccessCode_handlesException() {
        caseRequest.setCases(null);

        assertThrows(CustomException.class, () -> caseRegistrationEnrichment.enrichAccessCode(caseRequest));
    }

    @Test
    public void testEnrichLitigantsOnCreate() {
        // Create a new litigant without an ID (to be created)
        Party newParty = new Party();
        newParty.setDocuments(new ArrayList<>());
        courtCase.setId(UUID.randomUUID());
        courtCase.getLitigants().add(newParty);
        AuditDetails auditDetails = new AuditDetails("createdBy", "lastModifiedBy", System.currentTimeMillis(), System.currentTimeMillis());
        CaseRegistrationEnrichment.enrichLitigantsOnCreateAndUpdate(courtCase, auditDetails);
        // Assert that the new party has been assigned an ID, case ID, and audit details
        assertEquals(courtCase.getId().toString(), newParty.getCaseId());
        assertEquals(auditDetails, newParty.getAuditDetails());
    }
    @Test
    public void testEnrichRepOnCreate() {
        AdvocateMapping representative = new AdvocateMapping();
        representative.setDocuments(new ArrayList<>());
        courtCase.setId(UUID.randomUUID());
        courtCase.getRepresentatives().add(representative);
        AuditDetails auditDetails = new AuditDetails("createdBy", "lastModifiedBy", System.currentTimeMillis(), System.currentTimeMillis());
        CaseRegistrationEnrichment.enrichRepresentativesOnCreateAndUpdate(courtCase, auditDetails);
        assertEquals(courtCase.getId().toString(), representative.getCaseId());
        assertEquals(auditDetails, representative.getAuditDetails());
    }
    @Test
    public void testNoLitigants() {
        // No litigants in the court case
        courtCase.setLitigants(null);
        AuditDetails auditDetails = new AuditDetails("createdBy", "lastModifiedBy", System.currentTimeMillis(), System.currentTimeMillis());
        CaseRegistrationEnrichment.enrichLitigantsOnCreateAndUpdate(courtCase, auditDetails);
        // Assert that nothing breaks when there are no litigants
        assertEquals(null, courtCase.getLitigants());
    }
    @Test
    public void testNoRepresentatives() {
        courtCase.setId(UUID.randomUUID());
        courtCase.setRepresentatives(null);
        AuditDetails auditDetails = new AuditDetails("createdBy", "lastModifiedBy", System.currentTimeMillis(), System.currentTimeMillis());
        CaseRegistrationEnrichment.enrichRepresentativesOnCreateAndUpdate(courtCase, auditDetails);
        assertEquals(null, courtCase.getRepresentatives());
    }
    @Test
    public void testEnrichLitigantsOnUpdate() {
        // Create an existing litigant with an ID (to be updated)
        Party existingParty = new Party();
        existingParty.setId(UUID.randomUUID());
        existingParty.setDocuments(new ArrayList<>());
        courtCase.setId(UUID.randomUUID());
        courtCase.getLitigants().add(existingParty);
        AuditDetails auditDetails = new AuditDetails("createdBy", "lastModifiedBy", System.currentTimeMillis(), System.currentTimeMillis());
        CaseRegistrationEnrichment.enrichLitigantsOnCreateAndUpdate(courtCase, auditDetails);

        // Assert that the existing party's audit details have been updated
        assertEquals(auditDetails, existingParty.getAuditDetails());
    }
    @Test
    public void testEnrichRepresentativeOnUpdate() {
        AdvocateMapping existingRepresentative = new AdvocateMapping();
        existingRepresentative.setId("rep_id");
        existingRepresentative.setDocuments(new ArrayList<>());
        courtCase.setId(UUID.randomUUID());
        courtCase.getRepresentatives().add(existingRepresentative);
        AuditDetails auditDetails = new AuditDetails("createdBy", "lastModifiedBy", System.currentTimeMillis(), System.currentTimeMillis());
        CaseRegistrationEnrichment.enrichRepresentativesOnCreateAndUpdate(courtCase, auditDetails);
        assertEquals(auditDetails, existingRepresentative.getAuditDetails());
    }

    @Test
    void testEnrichCourtId_Success() {
        Map<String, Object> caseDetails = createCaseDetailsWithChequeDetails("1001");
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);
        
        Map<String, Map<String, JSONArray>> mdmsData = createMdmsDataWithPoliceStation("1001", "COURT001");
        when(mdmsUtil.fetchMdmsData(any(RequestInfo.class), eq("tenant-id"), eq("case"), any(List.class)))
            .thenReturn(mdmsData);
        
        JsonNode caseDetailsNode = createCaseDetailsJsonNode("1001");
        JsonNode policeStationNode = createPoliceStationJsonNode("1001", "COURT001");
        
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenAnswer(invocation -> {
            Object firstArg = invocation.getArgument(0);
            if (firstArg.equals(caseDetails)) {
                return caseDetailsNode;
            } else if (firstArg instanceof Map) {
                // This is likely a police station object from MDMS
                Map<?, ?> map = (Map<?, ?>) firstArg;
                if (Long.valueOf(1001).equals(map.get("code"))) {
                    return policeStationNode;
                }
            }
            return policeStationNode;
        });
        
        // Execute
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify
        assertEquals("COURT001", courtCase.getCourtId());
        verify(mdmsUtil).fetchMdmsData(any(RequestInfo.class), eq("tenant-id"), eq("case"), any(List.class));
    }
    
    @Test
    void testEnrichCourtId_NullCaseRequest() {
        caseRegistrationEnrichment.enrichCourtId(null);
    }
    
    @Test
    void testEnrichCourtId_NullCourtCase() {
        caseRequest.setCases(null);
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
    }
    
    @Test
    void testEnrichCourtId_NoPoliceStationCode() {
        Map<String, Object> caseDetails = new HashMap<>();
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);

        JsonNode emptyCaseDetailsNode = mock(JsonNode.class);
        JsonNode missingChequeDetails = mock(JsonNode.class);
        when(missingChequeDetails.isMissingNode()).thenReturn(true);
        when(emptyCaseDetailsNode.path("chequeDetails")).thenReturn(missingChequeDetails);
        when(objectMapper.convertValue(caseDetails, JsonNode.class)).thenReturn(emptyCaseDetailsNode);
        
        // Execute
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify - courtId should not be set
        assertNull(courtCase.getCourtId());
    }
    
    @Test
    void testEnrichCourtId_PoliceStationFoundButNoCourtId() {
        Map<String, Object> caseDetails = createCaseDetailsWithChequeDetails("1001");
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);
        
        Map<String, Map<String, JSONArray>> mdmsData = createMdmsDataWithPoliceStationNoCourtId("1001");
        when(mdmsUtil.fetchMdmsData(any(RequestInfo.class), eq("tenant-id"), eq("case"), any(List.class)))
            .thenReturn(mdmsData);
        
        JsonNode caseDetailsNode = createCaseDetailsJsonNode("1001");
        JsonNode policeStationNode = createPoliceStationJsonNodeNoCourtId("1001");
        
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenAnswer(invocation -> {
            Object firstArg = invocation.getArgument(0);
            if (firstArg.equals(caseDetails)) {
                return caseDetailsNode;
            } else if (firstArg instanceof Map) {
                // This is likely a police station object from MDMS
                Map<?, ?> map = (Map<?, ?>) firstArg;
                if (Long.valueOf(1001).equals(map.get("code"))) {
                    return policeStationNode;
                }
            }
            return policeStationNode;
        });
        
        // Execute
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify - courtId should not be set
        assertNull(courtCase.getCourtId());
    }
    
    @Test
    void testEnrichCourtId_PoliceStationNotFound() {
        Map<String, Object> caseDetails = createCaseDetailsWithChequeDetails("9999");
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);
        
        Map<String, Map<String, JSONArray>> mdmsData = createMdmsDataWithPoliceStation("1001", "COURT001");
        when(mdmsUtil.fetchMdmsData(any(RequestInfo.class), eq("tenant-id"), eq("case"), any(List.class)))
            .thenReturn(mdmsData);
        
        JsonNode caseDetailsNode = createCaseDetailsJsonNode("9999");
        JsonNode policeStationNode = createPoliceStationJsonNode("1001", "COURT001");
        
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenAnswer(invocation -> {
            Object firstArg = invocation.getArgument(0);
            if (firstArg.equals(caseDetails)) {
                return caseDetailsNode;
            } else if (firstArg instanceof Map) {
                // This is likely a police station object from MDMS
                Map<?, ?> map = (Map<?, ?>) firstArg;
                if (Long.valueOf(1001).equals(map.get("code"))) {
                    return policeStationNode;
                }
            }
            return policeStationNode;
        });
        
        // Execute
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify - courtId should not be set
        assertNull(courtCase.getCourtId());
    }
    
    @Test
    void testEnrichCourtId_MdmsDataNull() {
        Map<String, Object> caseDetails = createCaseDetailsWithChequeDetails("1001");
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);
        
        when(mdmsUtil.fetchMdmsData(any(RequestInfo.class), eq("tenant-id"), eq("case"), any(List.class)))
            .thenReturn(null);
        
        JsonNode caseDetailsNode = createCaseDetailsJsonNode("1001");
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenAnswer(invocation -> {
            Object firstArg = invocation.getArgument(0);
            if (firstArg.equals(caseDetails)) {
                return caseDetailsNode;
            }
            return caseDetailsNode;
        });
        
        // Execute
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify - courtId should not be set
        assertNull(courtCase.getCourtId());
    }
    
    @Test
    void testEnrichCourtId_ExceptionHandling() {
        Map<String, Object> caseDetails = createCaseDetailsWithChequeDetails("1001");
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);
        
        when(objectMapper.convertValue(caseDetails, JsonNode.class))
            .thenThrow(new RuntimeException("JSON processing error"));
        
        // Execute - should not throw exception due to try-catch
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify - courtId should not be set due to exception
        assertNull(courtCase.getCourtId());
    }
    
    @Test
    void testEnrichCourtId_EmptyPoliceStationCode() {
        Map<String, Object> caseDetails = createCaseDetailsWithChequeDetails("");
        courtCase.setCaseDetails(caseDetails);
        courtCase.setTenantId("tenant-id");
        caseRequest.setCases(courtCase);
        
        JsonNode caseDetailsNode = createCaseDetailsJsonNode("");
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenAnswer(invocation -> {
            Object firstArg = invocation.getArgument(0);
            if (firstArg.equals(caseDetails)) {
                return caseDetailsNode;
            }
            return caseDetailsNode;
        });
        
        // Execute
        caseRegistrationEnrichment.enrichCourtId(caseRequest);
        
        // Verify - courtId should not be set
        assertNull(courtCase.getCourtId());
    }
    
    private Map<String, Object> createCaseDetailsWithChequeDetails(String policeStationCode) {
        Map<String, Object> caseDetails = new HashMap<>();
        Map<String, Object> chequeDetails = new HashMap<>();
        List<Map<String, Object>> formdata = new ArrayList<>();
        Map<String, Object> formdataItem = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> policeStationJuris = new HashMap<>();
        policeStationJuris.put("code", policeStationCode);
        data.put("policeStationJurisDictionCheque", policeStationJuris);
        formdataItem.put("data", data);
        formdata.add(formdataItem);
        chequeDetails.put("formdata", formdata);
        caseDetails.put("chequeDetails", chequeDetails);
        return caseDetails;
    }
    
    private Map<String, Map<String, JSONArray>> createMdmsDataWithPoliceStation(String policeStationCode, String courtId) {
        Map<String, Map<String, JSONArray>> mdmsData = new HashMap<>();
        Map<String, JSONArray> caseModule = new HashMap<>();
        JSONArray policeStations = new JSONArray();
        
        Map<String, Object> policeStation = new HashMap<>();
        try {
            policeStation.put("code", Long.parseLong(policeStationCode));
        } catch (NumberFormatException e) {
            policeStation.put("code", policeStationCode);
        }
        policeStation.put("courtId", courtId);
        policeStations.add(policeStation);
        
        caseModule.put("PoliceStation", policeStations);
        mdmsData.put("case", caseModule);
        return mdmsData;
    }
    
    private Map<String, Map<String, JSONArray>> createMdmsDataWithPoliceStationNoCourtId(String policeStationCode) {
        Map<String, Map<String, JSONArray>> mdmsData = new HashMap<>();
        Map<String, JSONArray> caseModule = new HashMap<>();
        JSONArray policeStations = new JSONArray();
        
        Map<String, Object> policeStation = new HashMap<>();
        try {
            policeStation.put("code", Long.parseLong(policeStationCode));
        } catch (NumberFormatException e) {
            policeStation.put("code", policeStationCode);
        }
        policeStations.add(policeStation);
        
        caseModule.put("PoliceStation", policeStations);
        mdmsData.put("case", caseModule);
        return mdmsData;
    }
    
    private JsonNode createCaseDetailsJsonNode(String policeStationCode) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode caseDetailsNode = mapper.createObjectNode();
        ObjectNode chequeDetails = mapper.createObjectNode();
        ObjectNode data = mapper.createObjectNode();
        ObjectNode policeStationJuris = mapper.createObjectNode();
        
        policeStationJuris.put("code", policeStationCode);
        data.set("policeStationJurisDictionCheque", policeStationJuris);
        
        ObjectNode formdataItem = mapper.createObjectNode();
        formdataItem.set("data", data);
        var formdataArray = mapper.createArrayNode().add(formdataItem);
        
        chequeDetails.set("formdata", formdataArray);
        caseDetailsNode.set("chequeDetails", chequeDetails);
        
        return caseDetailsNode;
    }
    
    private JsonNode createPoliceStationJsonNode(String policeStationCode, String courtId) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode policeStationNode = mapper.createObjectNode();
        // Set code as number as per MDMS schema
        try {
            policeStationNode.put("code", Long.parseLong(policeStationCode));
        } catch (NumberFormatException e) {
            // Fallback to string if not numeric
            policeStationNode.put("code", policeStationCode);
        }
        policeStationNode.put("courtId", courtId);
        return policeStationNode;
    }
    
    private JsonNode createPoliceStationJsonNodeNoCourtId(String policeStationCode) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode policeStationNode = mapper.createObjectNode();
        try {
            policeStationNode.put("code", Long.parseLong(policeStationCode));
        } catch (NumberFormatException e) {
            policeStationNode.put("code", policeStationCode);
        }
        return policeStationNode;
    }
}

