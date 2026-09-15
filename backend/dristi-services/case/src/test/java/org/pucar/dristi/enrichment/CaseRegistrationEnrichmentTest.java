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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.pucar.dristi.config.ServiceConstants.ADMIT_CASE_WORKFLOW_ACTION;
import static org.pucar.dristi.config.ServiceConstants.ADVOCATE_ROLE;
import static org.pucar.dristi.config.ServiceConstants.COURT_ASSIGNED_ROLE;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.HrmsUtil;
import org.pucar.dristi.util.IdgenUtil;

@ExtendWith(MockitoExtension.class)
class CaseRegistrationEnrichmentTest {

    @Mock
    private IdgenUtil idgenUtil;
    @Mock
    private CaseUtil caseUtil;

    @Mock
    private Configuration config;

    @Mock
    private IndividualService individualService;

    @Mock
    private AdvocateUtil advocateUtil;

    @Mock
    private HrmsUtil hrmsUtil;

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
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
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

    // ------------------------------------------------------------------
    // Helpers for enrichCaseSearchRequest / enrichCitizenUserId coverage
    // ------------------------------------------------------------------

    private static final String INDIVIDUAL_ID = "individual-123";

    private RequestInfo buildRequestInfo(String type, String... roleCodes) {
        RequestInfo ri = new RequestInfo();
        User user = new User();
        user.setType(type);
        List<Role> roles = new ArrayList<>();
        for (String code : roleCodes) {
            roles.add(Role.builder().code(code).build());
        }
        user.setRoles(roles);
        ri.setUserInfo(user);
        return ri;
    }

    // ===================== CaseSearchRequest (list) =====================

    @Test
    void enrichCaseSearchRequest_list_citizen_defaultsCasesForToAll_nonAdvocate() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);

        // client supplied values that must be discarded
        CaseCriteria criteria = new CaseCriteria();
        criteria.setAdvocateId("client-advocate");
        criteria.setLitigantId("client-litigant");
        criteria.setPoaHolderIndividualId("client-poa");
        // casesFor left null on purpose

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("citizen"))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(CasesFor.ALL, criteria.getCasesFor());
        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
        verify(advocateUtil, never()).fetchAdvocatesByIndividualId(any(), any());
    }

    @Test
    void enrichCaseSearchRequest_list_citizen_all_advocate_withAdvocateFound() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        UUID advId = UUID.randomUUID();
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.singletonList(Advocate.builder().id(advId).build()));

        CaseCriteria criteria = new CaseCriteria();
        criteria.setCasesFor(CasesFor.ALL);

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(advId.toString(), criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequest_list_citizen_all_advocate_noAdvocateFound() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.emptyList());

        CaseCriteria criteria = new CaseCriteria();
        criteria.setCasesFor(CasesFor.ALL);

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequest_list_citizen_poaLitigant() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);

        CaseCriteria criteria = new CaseCriteria();
        criteria.setCasesFor(CasesFor.POA_LITIGANT);

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("citizen"))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
        verify(advocateUtil, never()).fetchAdvocatesByIndividualId(any(), any());
    }

    @Test
    void enrichCaseSearchRequest_list_citizen_advocateOnly() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        UUID advId = UUID.randomUUID();
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.singletonList(Advocate.builder().id(advId).build()));

        CaseCriteria criteria = new CaseCriteria();
        criteria.setCasesFor(CasesFor.ADVOCATE);

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(advId.toString(), criteria.getAdvocateId());
        assertNull(criteria.getLitigantId());
        assertNull(criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequest_list_citizen_emptyCriteria_earlyReturn() {
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>())
                .requestInfo(buildRequestInfo("citizen"))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        verify(individualService, never()).getIndividualId(any());
    }

    @Test
    void enrichCaseSearchRequest_list_citizen_nullCriteria_earlyReturn() {
        CaseSearchRequest request = CaseSearchRequest.builder()
                .requestInfo(buildRequestInfo("citizen"))
                .build();
        request.setCriteria(null);

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        verify(individualService, never()).getIndividualId(any());
    }

    @Test
    void enrichCaseSearchRequest_list_employee_courtAssigned_setsCourtId() {
        when(hrmsUtil.getCourtId(any(RequestInfo.class))).thenReturn("court-1");

        CaseCriteria criteria = new CaseCriteria();
        criteria.setCourtId("client-court");

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("employee", COURT_ASSIGNED_ROLE))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals("court-1", criteria.getCourtId());
    }

    @Test
    void enrichCaseSearchRequest_list_employee_notCourtAssigned_clearsCourtId() {
        CaseCriteria criteria = new CaseCriteria();
        criteria.setCourtId("client-court");

        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>(Collections.singletonList(criteria)))
                .requestInfo(buildRequestInfo("employee"))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getCourtId());
    }

    @Test
    void enrichCaseSearchRequest_list_systemUser_noOp() {
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>())
                .requestInfo(buildRequestInfo("system"))
                .build();

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        verify(individualService, never()).getIndividualId(any());
    }

    @Test
    void enrichCaseSearchRequest_list_unknownType_throws() {
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(new ArrayList<>())
                .requestInfo(buildRequestInfo("alien"))
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> caseRegistrationEnrichment.enrichCaseSearchRequest(request));
    }

    // ===================== CaseSearchRequestV2 =====================

    @Test
    void enrichCaseSearchRequestV2_citizen_defaultsCasesForToAll_nonAdvocate() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);

        CaseSearchCriteriaV2 criteria = new CaseSearchCriteriaV2();
        criteria.setAdvocateId("client-advocate");
        criteria.setLitigantId("client-litigant");
        criteria.setPoaHolderIndividualId("client-poa");

        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(CasesFor.ALL, criteria.getCasesFor());
        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequestV2_citizen_all_advocate_found() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        UUID advId = UUID.randomUUID();
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.singletonList(Advocate.builder().id(advId).build()));

        CaseSearchCriteriaV2 criteria = new CaseSearchCriteriaV2();
        criteria.setCasesFor(CasesFor.ALL);

        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(advId.toString(), criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequestV2_citizen_poaLitigant() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);

        CaseSearchCriteriaV2 criteria = new CaseSearchCriteriaV2();
        criteria.setCasesFor(CasesFor.POA_LITIGANT);

        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequestV2_citizen_advocateOnly_noAdvocateFound() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.emptyList());

        CaseSearchCriteriaV2 criteria = new CaseSearchCriteriaV2();
        criteria.setCasesFor(CasesFor.ADVOCATE);

        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getAdvocateId());
        assertNull(criteria.getLitigantId());
        assertNull(criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSearchRequestV2_employee_courtAssigned_setsCourtId() {
        when(hrmsUtil.getCourtId(any(RequestInfo.class))).thenReturn("court-9");

        CaseSearchCriteriaV2 criteria = new CaseSearchCriteriaV2();

        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("employee", COURT_ASSIGNED_ROLE));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals("court-9", criteria.getCourtId());
    }

    @Test
    void enrichCaseSearchRequestV2_employee_notCourtAssigned_clearsCourtId() {
        CaseSearchCriteriaV2 criteria = new CaseSearchCriteriaV2();
        criteria.setCourtId("client-court");

        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("employee"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getCourtId());
    }

    @Test
    void enrichCaseSearchRequestV2_systemUser_noOp() {
        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(new CaseSearchCriteriaV2());
        request.setRequestInfo(buildRequestInfo("system"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        verify(individualService, never()).getIndividualId(any());
    }

    @Test
    void enrichCaseSearchRequestV2_unknownType_throws() {
        CaseSearchRequestV2 request = new CaseSearchRequestV2();
        request.setCriteria(new CaseSearchCriteriaV2());
        request.setRequestInfo(buildRequestInfo("alien"));

        assertThrows(IllegalArgumentException.class,
                () -> caseRegistrationEnrichment.enrichCaseSearchRequest(request));
    }

    // ===================== CaseSummaryListRequest =====================

    @Test
    void enrichCaseSummaryList_citizen_defaultsCasesForToAll_nonAdvocate() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);

        CaseSummaryListCriteria criteria = new CaseSummaryListCriteria();
        criteria.setAdvocateId("client-advocate");
        criteria.setLitigantId("client-litigant");
        criteria.setPoaHolderIndividualId("client-poa");

        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(CasesFor.ALL, criteria.getCasesFor());
        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSummaryList_citizen_all_advocate_found() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        UUID advId = UUID.randomUUID();
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.singletonList(Advocate.builder().id(advId).build()));

        CaseSummaryListCriteria criteria = new CaseSummaryListCriteria();
        criteria.setCasesFor(CasesFor.ALL);

        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(advId.toString(), criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSummaryList_citizen_poaLitigant() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);

        CaseSummaryListCriteria criteria = new CaseSummaryListCriteria();
        criteria.setCasesFor(CasesFor.POA_LITIGANT);

        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getAdvocateId());
        assertEquals(INDIVIDUAL_ID, criteria.getLitigantId());
        assertEquals(INDIVIDUAL_ID, criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSummaryList_citizen_advocateOnly() {
        when(individualService.getIndividualId(any(RequestInfo.class))).thenReturn(INDIVIDUAL_ID);
        UUID advId = UUID.randomUUID();
        when(advocateUtil.fetchAdvocatesByIndividualId(any(), eq(INDIVIDUAL_ID)))
                .thenReturn(Collections.singletonList(Advocate.builder().id(advId).build()));

        CaseSummaryListCriteria criteria = new CaseSummaryListCriteria();
        criteria.setCasesFor(CasesFor.ADVOCATE);

        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("citizen", ADVOCATE_ROLE));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals(advId.toString(), criteria.getAdvocateId());
        assertNull(criteria.getLitigantId());
        assertNull(criteria.getPoaHolderIndividualId());
    }

    @Test
    void enrichCaseSummaryList_employee_courtAssigned_setsCourtId() {
        when(hrmsUtil.getCourtId(any(RequestInfo.class))).thenReturn("court-5");

        CaseSummaryListCriteria criteria = new CaseSummaryListCriteria();

        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("employee", COURT_ASSIGNED_ROLE));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertEquals("court-5", criteria.getCourtId());
    }

    @Test
    void enrichCaseSummaryList_employee_notCourtAssigned_clearsCourtId() {
        CaseSummaryListCriteria criteria = new CaseSummaryListCriteria();
        criteria.setCourtId("client-court");

        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(buildRequestInfo("employee"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        assertNull(criteria.getCourtId());
    }

    @Test
    void enrichCaseSummaryList_systemUser_noOp() {
        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(new CaseSummaryListCriteria());
        request.setRequestInfo(buildRequestInfo("system"));

        caseRegistrationEnrichment.enrichCaseSearchRequest(request);

        verify(individualService, never()).getIndividualId(any());
    }

    @Test
    void enrichCaseSummaryList_unknownType_throws() {
        CaseSummaryListRequest request = new CaseSummaryListRequest();
        request.setCriteria(new CaseSummaryListCriteria());
        request.setRequestInfo(buildRequestInfo("alien"));

        assertThrows(IllegalArgumentException.class,
                () -> caseRegistrationEnrichment.enrichCaseSearchRequest(request));
    }
}

