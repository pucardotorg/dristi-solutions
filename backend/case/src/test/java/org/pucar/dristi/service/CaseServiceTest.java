package org.pucar.dristi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.*;

import java.util.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;
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
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.enrichment.CaseRegistrationEnrichment;
import org.pucar.dristi.enrichment.EnrichmentService;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.BillingUtil;
import org.pucar.dristi.util.EncryptionDecryptionUtil;
import org.pucar.dristi.util.TaskUtil;
import org.pucar.dristi.validators.CaseRegistrationValidator;
import org.pucar.dristi.web.OpenApiCaseSummary;
import org.pucar.dristi.web.models.*;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
public class CaseServiceTest {

    @Mock
    private CaseRegistrationValidator validator;
    @Mock
    private CaseRegistrationEnrichment enrichmentUtil;
    @Mock
    private CaseRepository caseRepository;
    @Mock
    private WorkflowService workflowService;
    @Mock
    private Configuration config;
    @Mock
    private Producer producer;
    @Mock
    private EncryptionDecryptionUtil encryptionDecryptionUtil;

    @Mock
    private CacheService cacheService;
    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SmsNotificationService notificationService;

    @Mock
    private IndividualService individualService;

    @Mock
    private AdvocateUtil advocateUtil;

    @Mock
    private TaskUtil taskUtil;

    @Mock
    private EnrichmentService enrichmentService;

    @Mock
    private ServiceRequestRepository repository;


    @InjectMocks
    private CaseService caseService;

    private CaseRequest caseRequest;
    private RequestInfo requestInfo;
    private User userInfo;

    private JoinCaseRequest joinCaseRequest;
    private CourtCase courtCase;

    private CaseSearchRequest caseSearchRequest;

    private CaseExistsRequest caseExistsRequest;

    private CaseCriteria caseCriteria;

    private static final String TEST_CASE_ID = "case-id";

    private static final String TEST_FILING_NUMBER = "CASE123";

    private static final String TEST_TENANT_ID = "tenant-id";

    @BeforeEach
    void setup() {
        caseRequest = new CaseRequest();
        courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        caseRequest.setCases(courtCase);
        caseSearchRequest = new CaseSearchRequest();
        caseCriteria = new CaseCriteria();
        caseCriteria.setCaseId(TEST_CASE_ID);
        caseSearchRequest.setCriteria(Collections.singletonList(caseCriteria));
        caseExistsRequest = new CaseExistsRequest();
        requestInfo = new RequestInfo();
        userInfo = new User();
        userInfo.setUuid("user-uuid");
        userInfo.setType("employee");
        userInfo.setTenantId("tenant-id");
        Role role = new Role();
        role.setName("employee");
        userInfo.setRoles(Collections.singletonList(role));
        requestInfo.setUserInfo(userInfo);
        caseSearchRequest.setRequestInfo(requestInfo);
        // Initialize mocks and create necessary objects for the tests
        joinCaseRequest = new JoinCaseRequest();
        joinCaseRequest.setAdditionalDetails("form-data");
        courtCase = new CourtCase();
        objectMapper = new ObjectMapper();
        enrichmentService = new EnrichmentService(new ArrayList<>());
        caseService = new CaseService(validator,enrichmentUtil,caseRepository,workflowService,config,producer,taskUtil,new BillingUtil(new RestTemplate(),config),encryptionDecryptionUtil,objectMapper,cacheService,enrichmentService, notificationService, individualService, advocateUtil);
    }

    CaseCriteria setupTestCaseCriteria(CourtCase courtCase) {
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(TEST_FILING_NUMBER).build();
        if (courtCase != null) {
            caseCriteria.setResponseList(Collections.singletonList(courtCase));
        } else {
            caseCriteria.setResponseList(Collections.emptyList());
        }
        return caseCriteria;
    }
    @Test
    void testCreateCase() {
        // Set up mock responses
        doNothing().when(validator).validateCaseRegistration(any());
        doNothing().when(enrichmentUtil).enrichCaseRegistrationOnCreate(any());
        doNothing().when(workflowService).updateWorkflowStatus(any());
        when(encryptionDecryptionUtil.encryptObject(any(),any(),any())).thenReturn(caseRequest.getCases());
        when(encryptionDecryptionUtil.decryptObject(any(),any(),any(),any())).thenReturn(caseRequest.getCases());
        doNothing().when(producer).push(any(), any()); // Stubbing to accept any arguments
        doNothing().when(cacheService).save(anyString(), any());
        // Call the method under test
        CourtCase result = caseService.createCase(caseRequest);

        // Assert and verify
        assertNotNull(result);
        verify(validator, times(1)).validateCaseRegistration(any());
        verify(enrichmentUtil, times(1)).enrichCaseRegistrationOnCreate(any());
        verify(workflowService, times(1)).updateWorkflowStatus(any());
        verify(producer, times(1)).push(any(), any()); // Verifying the method was called with any arguments
    }

    @Test
    public void testVerifyJoinCaseRequest_CaseDoesNotExist() {
        // Mock the CaseRepository to return an empty list
        CaseCriteria caseCriteria = setupTestCaseCriteria(null);
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));
        joinCaseRequest.setCaseFilingNumber("12345");
        joinCaseRequest.setAccessCode("validAccessCode");
        assertThrows(CustomException.class, () -> {
            caseService.verifyJoinCaseRequest(joinCaseRequest,true);
        });

    }

    @Test
    public void testVerifyJoinCaseRequest_AccessCodeNotGenerated() {
        // Setup a sample CourtCase object access code as null
        joinCaseRequest.setCaseFilingNumber("12345");
        joinCaseRequest.setAccessCode("validAccessCode");
        AdvocateMapping representative = new AdvocateMapping();
        representative.setAdvocateId("existingAdv");

        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber(joinCaseRequest.getCaseFilingNumber());
        courtCase.setStatus(CASE_ADMIT_STATUS);
        courtCase.setRepresentatives(Collections.singletonList(representative));
        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));
        assertThrows(CustomException.class, () -> {
            caseService.verifyJoinCaseRequest(joinCaseRequest,true);
        });
    }

    @Test
    public void testVerifyJoinCaseRequest_LitigantAlreadyExists() {
        // Setup a Litigant that is already part of the case
        Party litigant = new Party();
        litigant.setIndividualId("existingLitigant");
        courtCase.setId(UUID.randomUUID());
        courtCase.setAccessCode("validAccessCode");
        courtCase.setStatus(CASE_ADMIT_STATUS);
        courtCase.setLitigants(Collections.singletonList(litigant));

        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class), any(RequestInfo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        joinCaseRequest.setRequestInfo(requestInfo);
        joinCaseRequest.setCaseFilingNumber("12345");
        joinCaseRequest.setAccessCode("validAccessCode");
        joinCaseRequest.setLitigant(Collections.singletonList(litigant));

        when(validator.canLitigantJoinCase(joinCaseRequest)).thenReturn(true);
        when(config.getCaseDecryptSelf()).thenReturn("CaseDecryptSelf");

        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.verifyJoinCaseRequest(joinCaseRequest,true);
        });

        assertEquals(VALIDATION_ERR, exception.getCode());
        assertEquals("Litigant is already a part of the given case", exception.getMessage());
    }

    @Test
    public void testVerifyJoinCaseRequestInvalidAccessCode() {
        String filingNumber = "filing-number";
        joinCaseRequest.setCaseFilingNumber(filingNumber);
        joinCaseRequest.setAccessCode("access-code");

        Party party = Party.builder().individualId("individual-id").partyType(ServiceConstants.COMPLAINANT_PRIMARY).isActive(true).auditDetails(new AuditDetails()).build();
        AdvocateMapping advocateMapping = AdvocateMapping.builder().representing(Collections.singletonList(party)).isActive(true).auditDetails(new AuditDetails()).build();
        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        requestInfo.setUserInfo(new User());
        joinCaseRequest.setRequestInfo(requestInfo);

        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class), any(RequestInfo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(config.getCaseDecryptSelf()).thenReturn("CaseDecryptSelf");
        CustomException exception = assertThrows(CustomException.class, () -> caseService.verifyJoinCaseRequest(joinCaseRequest,true));

        assertEquals("VALIDATION_EXCEPTION", exception.getCode());
        assertEquals("Access code not generated", exception.getMessage());
    }

    @Test
    public void testVerifyJoinCaseRequest_RepresentativesAlreadyExists() {
        Representing litigant = new Representing();
        litigant.setIndividualId("existingLitigant");
        litigant.setPartyType("primary");
        AdvocateMapping advocate = new AdvocateMapping();
        advocate.setAdvocateId("existingAdv");
        advocate.setRepresenting(Collections.singletonList(litigant));

        courtCase.setId(UUID.randomUUID());
        courtCase.setAccessCode("validAccessCode");
        courtCase.setStatus(CASE_ADMIT_STATUS);
        courtCase.setRepresentatives(Collections.singletonList(advocate));

        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class), any(RequestInfo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        Representative representative = new Representative();
        representative.setAdvocateId("existingAdv");
        representative.setRepresenting(Collections.singletonList(litigant));

        joinCaseRequest.setRequestInfo(requestInfo);
        joinCaseRequest.setCaseFilingNumber("12345");
        joinCaseRequest.setAccessCode("validAccessCode");
        joinCaseRequest.setRepresentative(representative);
        when(validator.canRepresentativeJoinCase(joinCaseRequest)).thenReturn(true);
        when(config.getCaseDecryptSelf()).thenReturn("CaseDecryptSelf");

        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.verifyJoinCaseRequest(joinCaseRequest,true);
        });

        assertEquals("Advocate is already representing the individual", exception.getMessage());
    }

    @Test
    void testVerifyJoinCaseRequest_DisableExistingRepresenting() throws JsonProcessingException {
        // Prepare data for the test
        String filingNumber = "filing-number";
        joinCaseRequest.setCaseFilingNumber(filingNumber);
        joinCaseRequest.setAccessCode("access-code");

        Party party = Party.builder().individualId("111").partyType(ServiceConstants.COMPLAINANT_PRIMARY).isActive(true).auditDetails(new AuditDetails()).build();
        AdvocateMapping advocateMapping = AdvocateMapping.builder().advocateId("222").representing(Collections.singletonList(party)).isActive(true).auditDetails(new AuditDetails()).build();
        List<AdvocateMapping> advocates = new ArrayList<>();
        advocates.add(advocateMapping);

        courtCase.setRepresentatives(advocates);
        courtCase.setAccessCode("access-code");
        courtCase.setId(UUID.randomUUID());

        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        when(config.getRepresentativeJoinCaseTopic()).thenReturn("update-topic");
        when(validator.canRepresentativeJoinCase(joinCaseRequest)).thenReturn(true);
        when(individualService.getIndividualsByIndividualId(requestInfo, "111")).thenReturn(null);

        User user = new User();
        user.setTenantId(TEST_TENANT_ID);
        requestInfo.setUserInfo(user);
        joinCaseRequest.setRequestInfo(requestInfo);
        Representing party1 = Representing.builder().individualId("111").partyType(ServiceConstants.COMPLAINANT_PRIMARY).isActive(true).auditDetails(new AuditDetails()).build();
        Representative advocateMapping2 = Representative.builder().advocateId("333").representing(Collections.singletonList(party1)).isActive(true).auditDetails(new AuditDetails()).build();
        joinCaseRequest.setRepresentative(advocateMapping2);

        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class), any(RequestInfo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(encryptionDecryptionUtil.encryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LinkedHashMap<String, Object> additionalDetails = new LinkedHashMap<>();
        additionalDetails.put(ADVOCATE_NAME, "John Doe");
        String additionalDetails1Json = """
        {
            "advocateDetails": {
                "advocateName": "John Doe",
                "advocateId": "ADV-2024-01"
            },
            "respondentDetails": {
                "formdata": [
                    {
                        "data": {
                            "respondentLastName": "Doe",
                            "respondentFirstName": "John",
                            "respondentMiddleName": "M",
                            "respondentVerification": {
                                "individualDetails": {
                                    "individualId": "IND-2024-08-21-002193",
                                    "document": null
                                }
                            }
                        }
                    }
                ]
            }
        }
        """;

        String additionalDetails2Json = """
        {
            "caseId": "CASE-2024-01",
            "advocateDetails": {
                "advocateName": "Jane Smith",
                "advocateId": "ADV-2024-02"
            },
            "respondentDetails": {
                "formdata": [
                    {
                        "data": {
                            "respondentVerification": {
                                "individualDetails": {
                                    "individualId": "IND-2024-08-21-002193",
                                    "document": "SomeDocument"
                                }
                            }
                        }
                    }
                ]
            }
        }
        """;

        advocateMapping2.setAdditionalDetails(additionalDetails);
        Object additionalDetails1 = objectMapper.readValue(additionalDetails1Json, Object.class);
        Object additionalDetails2 = objectMapper.readValue(additionalDetails2Json, Object.class);
        courtCase.setAdditionalDetails(additionalDetails1);
        joinCaseRequest.setAdditionalDetails(additionalDetails2);
        when(config.getCaseDecryptSelf()).thenReturn("CaseDecryptSelf");
        when(config.getCourtCaseEncrypt()).thenReturn("CourtCase");
        doNothing().when(cacheService).save(any(),any());

        // Call the method
        JoinCaseResponse response = caseService.verifyJoinCaseRequest(joinCaseRequest,true);

        // Verify the results
        assertNotNull(response);
    }

    @Test
    public void testVerifyJoinCaseRequest_Success() throws JsonProcessingException {
        Party litigant = new Party();
        litigant.setIndividualId("newLitigant");
        Representative advocate = new Representative();
        advocate.setAdvocateId("newAdvocate");
        courtCase.setId(UUID.randomUUID());
        courtCase.setAccessCode("validAccessCode");
        courtCase.setStatus(CASE_ADMIT_STATUS);

        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));
        joinCaseRequest.setRequestInfo(requestInfo);
        joinCaseRequest.setCaseFilingNumber("12345");
        joinCaseRequest.setAccessCode("validAccessCode");
        joinCaseRequest.setLitigant(Collections.singletonList(litigant));
        joinCaseRequest.setAdditionalDetails("form-data");
        LinkedHashMap<String, Object> additionalDetails = new LinkedHashMap<>();
        additionalDetails.put(ADVOCATE_NAME, "John Doe");
        String additionalDetails1Json = """
        {
            "advocateDetails": {
                "advocateName": "John Doe",
                "advocateId": "ADV-2024-01"
            },
            "respondentDetails": {
                "formdata": [
                    {
                        "data": {
                            "respondentLastName": "Doe",
                            "respondentFirstName": "John",
                            "respondentMiddleName": "M",
                            "respondentVerification": {
                                "individualDetails": {
                                    "individualId": "IND-2024-08-21-002193",
                                    "document": null
                                }
                            }
                        }
                    }
                ]
            }
        }
        """;

        String additionalDetails2Json = """
        {
            "caseId": "CASE-2024-01",
            "advocateDetails": {
                "advocateName": "Jane Smith",
                "advocateId": "ADV-2024-02"
            },
            "respondentDetails": {
                "formdata": [
                    {
                        "data": {
                            "respondentVerification": {
                                "individualDetails": {
                                    "individualId": "IND-2024-08-21-002193",
                                    "document": "SomeDocument"
                                }
                            }
                        }
                    }
                ]
            }
        }
        """;
        advocate.setAdditionalDetails(additionalDetails);
        Object additionalDetails1 = objectMapper.readValue(additionalDetails1Json, Object.class);
        Object additionalDetails2 = objectMapper.readValue(additionalDetails2Json, Object.class);
        courtCase.setAdditionalDetails(additionalDetails1);
        joinCaseRequest.setAdditionalDetails(additionalDetails2);
        when(config.getCaseDecryptSelf()).thenReturn("CaseDecryptSelf");
        when(config.getCourtCaseEncrypt()).thenReturn("CourtCase");

        joinCaseRequest.setRepresentative(advocate);
        when(validator.canLitigantJoinCase(joinCaseRequest)).thenReturn(true);
        when(validator.canRepresentativeJoinCase(joinCaseRequest)).thenReturn(true);

        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class), any(RequestInfo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(encryptionDecryptionUtil.encryptObject(any(CourtCase.class), any(String.class), eq(CourtCase.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        doNothing().when(cacheService).save(any(),any());

        JoinCaseResponse response = caseService.verifyJoinCaseRequest(joinCaseRequest,true);
        assertEquals("validAccessCode", response.getJoinCaseRequest().getAccessCode());
        assertEquals("12345", response.getJoinCaseRequest().getCaseFilingNumber());
        assertEquals(litigant, response.getJoinCaseRequest().getLitigant().get(0));
    }

    @Test
    public void testVerifyRepresentativesAndJoinCase_throwsException() {
        // Given
        String filingNumber = "123";
        joinCaseRequest.setCaseFilingNumber(filingNumber);
        joinCaseRequest.setAccessCode("validAccessCode");
        User user = new User();
        user.setUuid("user-uuid");
        requestInfo.setUserInfo(user);
        joinCaseRequest.setRequestInfo(requestInfo);

        courtCase.setId(UUID.randomUUID());
        courtCase.setAccessCode("validAccessCode");

        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));


        Representative representative = new Representative();
        representative.setAdvocateId("advocate-1");
        Representing party = new Representing();
        party.setIndividualId("individual-1");
        representative.setRepresenting(Collections.singletonList(party));
        joinCaseRequest.setRepresentative(representative);

        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ed14dc62-6162-4e29-8b4b-51e8cd25646c");
        Party party1 = new Party();
        party.setIndividualId("111");
        advocateMapping.setRepresenting(Collections.singletonList(party1));
        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        // When
       CustomException exception = assertThrows(CustomException.class, ()->caseService.verifyJoinCaseRequest(joinCaseRequest,true));
       assertEquals("Invalid request for joining a case",exception.getMessage());
    }


    @Test
    void testSearchCases() {
        // Set up mock responses
        List<CaseCriteria> mockCases = new ArrayList<>(); // Assume filled with test data
        when(caseRepository.getCases(any(), any())).thenReturn(mockCases);

        // Call the method under test
        caseService.searchCases(caseSearchRequest);

        verify(caseRepository, times(1)).getCases(any(), any());
    }

    @Test
    void testSearchCases2() {

        List<CaseCriteria> mockCases = new ArrayList<>();
        caseCriteria.setResponseList(new ArrayList<>());
        mockCases.add(caseCriteria);
        // Set up mock responses
        when(caseRepository.getCases(any(), any())).thenReturn(mockCases);

        // Call the method under test
        caseService.searchCases(caseSearchRequest);

        verify(caseRepository, times(1)).getCases(any(), any());
    }

    @Test
    void testSearchCases_CustomException() {
        when(caseRepository.getCases(any(), any())).thenThrow(CustomException.class);

        assertThrows(CustomException.class, () -> caseService.searchCases(caseSearchRequest));
    }

    @Test
    void testSearchCases_Exception() {
        when(caseRepository.getCases(any(), any())).thenThrow(new RuntimeException());

        assertThrows(Exception.class, () -> caseService.searchCases(caseSearchRequest));
    }

    @Test
    void testRegisterCaseRequest_CustomException() {
        // Setup
        doThrow(new CustomException("VALIDATION", "Validation failed")).when(validator).validateCaseRegistration(any(CaseRequest.class));

        // Execute & Assert
        assertThrows(CustomException.class, () -> {
            caseService.createCase(caseRequest);
        });
    }

    @Test
    void testRegisterCaseRequest_Exception() {
        // Setup
        doThrow(new RuntimeException()).when(validator).validateCaseRegistration(any(CaseRequest.class));

        // Execute & Assert
        assertThrows(Exception.class, () -> {
            caseService.createCase(caseRequest);
        });
    }

    @Test
    void testUpdateCase_Success() {
        // Setup

        String updatedStatus = "STATUS";
        CourtCase courtCase = new CourtCase(); // Mock case-indexer.yml CourtCase object with required fields
        courtCase.setId(UUID.randomUUID());
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("action");
        courtCase.setWorkflow(workflow);
        caseRequest.setCases(courtCase);
        courtCase.setStatus(updatedStatus);
        when(validator.validateUpdateRequest(any(CaseRequest.class),any())).thenReturn(true);
        doNothing().when(enrichmentUtil).enrichCaseApplicationUponUpdate(any(CaseRequest.class),any());
        doNothing().when(workflowService).updateWorkflowStatus(any(CaseRequest.class));
        when(encryptionDecryptionUtil.encryptObject(any(),any(),any())).thenReturn(courtCase);

        doNothing().when(producer).push(anyString(), any(CaseRequest.class));
        doNothing().when(cacheService).save(anyString(), any());
        when(config.getCaseUpdateTopic()).thenReturn("case-update-topic");
        List<CaseCriteria> caseCriteriaList = new ArrayList<>();
        CaseCriteria caseCriteria = new CaseCriteria();
        caseCriteria.setCaseId(courtCase.getId().toString());
        caseCriteria.setResponseList(Collections.singletonList(courtCase));
        caseCriteriaList.add(caseCriteria);
        when(caseRepository.getCases(any(), any())).thenReturn(caseCriteriaList);
        when(encryptionDecryptionUtil.decryptObject(any(),any(),eq(CourtCase.class),any())).thenReturn(courtCase);

        // Execute
        CourtCase results = caseService.updateCase(caseRequest);

        // Assert
        verify(producer).push(eq("case-update-topic"), any(CaseRequest.class));
    }

    @Test
    void testUpdateCase_Validation_ExistenceException() {
        CourtCase courtCase = new CourtCase(); // Assume the necessary properties are set
        caseRequest.setCases(courtCase);
        // Execute & Assert
        assertThrows(CustomException.class, () -> caseService.updateCase(caseRequest));
    }

    @Test
    void testExistCases_Success() {
        // Setup
        CaseExists caseExists = new CaseExists();
        caseExists.setCnrNumber("12345");
        caseExists.setFilingNumber("67890");

        caseExistsRequest.setCriteria(List.of(caseExists));

        when(caseRepository.checkCaseExists(any())).thenReturn(List.of(caseExists));

        // Execute
        List<CaseExists> results = caseService.existCases(caseExistsRequest);

        // Assert
        assertNotNull(results);
    }

    @Test
    void testExistCases_NoCasesExist() {
        // Setup
        CaseExists caseExists = new CaseExists();
        caseExists.setCnrNumber("12345");
        caseExists.setFilingNumber("67890");

        caseExistsRequest.setCriteria(List.of(caseExists));

        when(caseRepository.checkCaseExists(any())).thenReturn(new ArrayList<>());

        // Execute
        List<CaseExists> results = caseService.existCases(caseExistsRequest);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty() || !results.get(0).getExists());
    }

    @Test
    void testExistCases_CustomException() {
        // Setup
        when(caseRepository.checkCaseExists(any())).thenThrow(new CustomException("Error code", "Error msg"));

        // Execute & Assert
        assertThrows(CustomException.class, () -> caseService.existCases(caseExistsRequest));
    }

    @Test
    void testExistCases_Exception() {
        // Setup
        when(caseRepository.checkCaseExists(any())).thenThrow(new RuntimeException());

        // Execute & Assert
        assertThrows(Exception.class, () -> caseService.existCases(caseExistsRequest));
    }


    @Test
    void testRegisterCaseRequest_ValidInput() {
        CaseRequest caseRequest = new CaseRequest(); // Assume CaseRequest is suitably instantiated
        CourtCase cases = new CourtCase(); // Mock court case list
        cases.setId(UUID.randomUUID());
        caseRequest.setCases(cases);
        doNothing().when(validator).validateCaseRegistration(any(CaseRequest.class));
        doNothing().when(enrichmentUtil).enrichCaseRegistrationOnCreate(any(CaseRequest.class));
        doNothing().when(workflowService).updateWorkflowStatus(any(CaseRequest.class));
        when(encryptionDecryptionUtil.encryptObject(any(),any(),any())).thenReturn(cases);
        when(encryptionDecryptionUtil.decryptObject(any(),any(),any(),any())).thenReturn(cases);
        CourtCase result = caseService.createCase(caseRequest);

        assertNotNull(result);
        assertEquals(cases, result);

    }

    @Test
    void testSearchCases_EmptyResult() {
        CaseSearchRequest searchRequest = new CaseSearchRequest(); // Setup search request
        when(caseRepository.getCases(any(), any())).thenReturn(Arrays.asList());

        caseService.searchCases(searchRequest);
    }

    @Test
    public void testAddWitness_Success() {
        AddWitnessRequest addWitnessRequest = new AddWitnessRequest();
        addWitnessRequest.setCaseFilingNumber(TEST_FILING_NUMBER);
        addWitnessRequest.setAdditionalDetails("details");
        RequestInfo requestInfo = new RequestInfo();
        User user = new User();
        CourtCase cases = new CourtCase(); // Mock court case list
        cases.setId(UUID.randomUUID());
        user.setType("EMPLOYEE");
        user.setTenantId(TEST_TENANT_ID);
        Role role = new Role();
        role.setName("EMPLOYEE");
        user.setRoles(Collections.singletonList(role));
        requestInfo.setUserInfo(user);
        addWitnessRequest.setRequestInfo(requestInfo);

        CaseCriteria caseCriteria = setupTestCaseCriteria(cases);
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        when(encryptionDecryptionUtil.encryptObject(any(),any(),any())).thenReturn(cases);
        when(encryptionDecryptionUtil.decryptObject(any(),any(),any(),any())).thenReturn(cases);

        doNothing().when(cacheService).save(any(),any());
        when(config.getAdditionalJoinCaseTopic()).thenReturn("topic");
        AddWitnessResponse response = caseService.addWitness(addWitnessRequest);

        verify(producer, times(1)).push(eq("topic"), eq(addWitnessRequest));
        assertEquals(addWitnessRequest, response.getAddWitnessRequest());
        assertEquals(addWitnessRequest.getAdditionalDetails(), response.getAddWitnessRequest().getAdditionalDetails());
    }

    @Test
    public void testAddWitness_CaseNotFound() {
        AddWitnessRequest addWitnessRequest = new AddWitnessRequest();

        addWitnessRequest.setCaseFilingNumber(TEST_FILING_NUMBER);
        RequestInfo requestInfo = new RequestInfo();
        User user = new User();
        user.setType("EMPLOYEE");
        requestInfo.setUserInfo(user);
        addWitnessRequest.setRequestInfo(requestInfo);

        CaseCriteria caseCriteria = setupTestCaseCriteria(null); // or false for CaseNotFound scenario
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.addWitness(addWitnessRequest);
        });

        assertEquals("INVALID_CASE", exception.getCode());
        assertEquals("No case found for the given filing Number", exception.getMessage());
    }

    @Test
    public void testAddWitness_InvalidUser() {
        AddWitnessRequest addWitnessRequest = new AddWitnessRequest();
        addWitnessRequest.setCaseFilingNumber(TEST_FILING_NUMBER);
        addWitnessRequest.setAdditionalDetails("data");
        User user = new User();
        user.setType("CITIZEN");
        requestInfo.setUserInfo(user);
        addWitnessRequest.setRequestInfo(requestInfo);

        CourtCase cases = new CourtCase(); // Mock court case list
        cases.setId(UUID.randomUUID());

        CaseCriteria caseCriteria = setupTestCaseCriteria(cases);
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.addWitness(addWitnessRequest);
        });

        assertEquals("VALIDATION_EXCEPTION", exception.getCode());
        assertEquals("Not a valid user to add witness details", exception.getMessage());
    }

    @Test
    public void testAddWitness_AdditionalDetailsRequired() {
        AddWitnessRequest addWitnessRequest = new AddWitnessRequest();
        addWitnessRequest.setCaseFilingNumber(TEST_FILING_NUMBER);
        User user = new User();
        user.setType("EMPLOYEE");
        requestInfo.setUserInfo(user);
        addWitnessRequest.setRequestInfo(requestInfo);

        CourtCase cases = new CourtCase(); // Mock court case list
        cases.setId(UUID.randomUUID());

        CaseCriteria caseCriteria = setupTestCaseCriteria(cases);
        when(caseRepository.getCases(anyList(), any())).thenReturn(Collections.singletonList(caseCriteria));

        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.addWitness(addWitnessRequest);
        });

        assertEquals("VALIDATION_EXCEPTION", exception.getCode());
        assertEquals("Additional details are required", exception.getMessage());
    }

    @Test
    public void testSearchRedisCache_CaseFound() throws JsonProcessingException {
        caseCriteria = new CaseCriteria();
        caseCriteria.setCaseId(TEST_CASE_ID);
        String expectedId = "tenant-id:case-id";
        CourtCase expectedCourtCase = new CourtCase();
        when(cacheService.findById(expectedId)).thenReturn(expectedCourtCase);

        CourtCase result = caseService.searchRedisCache(requestInfo, caseCriteria.getCaseId());

        assertNotNull(result);
        assertEquals(expectedCourtCase, result);
    }

    @Test
    public void testSearchRedisCache_CaseNotFound() {
        CaseCriteria criteria = new CaseCriteria();
        criteria.setCaseId("123");


        when(cacheService.findById(anyString())).thenReturn(null);

        CourtCase result = caseService.searchRedisCache(requestInfo, criteria.getCaseId());

        assertNull(result);
    }

//    @Test
//    public void testSearchRedisCache_JsonProcessingException() throws JsonProcessingException {
//        CaseCriteria criteria = new CaseCriteria();
//        criteria.setCaseId("123");
//
//        CourtCase cachedValue = new CourtCase();
//
//        ObjectMapper objectMapperMock = mock(ObjectMapper.class);
//        when(cacheService.findById(anyString())).thenReturn(cachedValue);
//        when(objectMapperMock.writeValueAsString(cachedValue)).thenThrow(new JsonProcessingException("Error") {});
//
//        CustomException exception = assertThrows(CustomException.class, () -> {
//            caseService.searchRedisCache(requestInfo, criteria);
//        });
//
//        assertEquals("Error", exception.getMessage());
//    }

    @Test
    void saveInRedisCache_withValidCaseCriteriaAndCourtCase_savesToCache() {
        List<CourtCase> responseList = new ArrayList<>();
        courtCase.setId(UUID.randomUUID());
        responseList.add(courtCase);
        caseCriteria.setResponseList(responseList);

        List<CaseCriteria> casesList = new ArrayList<>();
        casesList.add(caseCriteria);

        doNothing().when(cacheService).save(anyString(), any());

        caseService.saveInRedisCache(casesList, requestInfo);
    }

    @Test
    void saveInRedisCache_withEmptyCasesList_doesNothing() {
        List<CaseCriteria> emptyList = new ArrayList<>();
        RequestInfo requestInfo = mock(RequestInfo.class);

        caseService.saveInRedisCache(emptyList, requestInfo);

        verifyNoInteractions(cacheService);
    }

    @Test
    void testCaseSummary_withEmptyRequest() {
        CaseSummaryRequest caseSummaryRequest = new CaseSummaryRequest();

        List<CaseSummary> response = caseService.getCaseSummary(caseSummaryRequest);

        assertNotNull(response);
    }

    @Test
    void testCaseSummary_withValidRequest() {
        CaseSummaryRequest caseSummaryRequest = new CaseSummaryRequest();

        CaseCriteria caseCriteria = new CaseCriteria();
        caseCriteria.setCaseId("case-id");
        caseCriteria.setResponseList(Collections.singletonList(courtCase));

        List<CaseSummary> response = caseService.getCaseSummary(caseSummaryRequest);

        assertNotNull(response);
    }

    @Test
    void testSearchByCnrNumber() {
        OpenApiCaseSummaryRequest openApiCaseSummaryRequest = new OpenApiCaseSummaryRequest();

        when(caseRepository.getCaseSummaryByCnrNumber(openApiCaseSummaryRequest)).thenReturn(new OpenApiCaseSummary());

        OpenApiCaseSummary response = caseService.searchByCnrNumber(openApiCaseSummaryRequest);

        assertNotNull(response);
    }

    @Test
    void testSearchByCaseType() {
        OpenApiCaseSummaryRequest openApiCaseSummaryRequest = new OpenApiCaseSummaryRequest();

        List<CaseListLineItem> caseListLineItems = new ArrayList<>();

        when(caseRepository.getCaseSummaryListByCaseType(openApiCaseSummaryRequest)).thenReturn(caseListLineItems);

        List<CaseListLineItem> response = caseService.searchByCaseType(openApiCaseSummaryRequest);

        assertNotNull(response);
    }

    @Test
    void testSearchByCaseNumber() {

        OpenApiCaseSummaryRequest openApiCaseSummaryRequest = new OpenApiCaseSummaryRequest();

        when(caseRepository.getCaseSummaryByCaseNumber(openApiCaseSummaryRequest)).thenReturn(new OpenApiCaseSummary());

        OpenApiCaseSummary response = caseService.searchByCaseNumber(openApiCaseSummaryRequest);

        assertNotNull(response);
    }

    @Test
    void testVerifyJoinCaseCodeV2Request_ValidAccessCode() {
        // Setup
        CaseCodeRequest caseCodeRequest = new CaseCodeRequest();
        CaseCodeCriteria caseCode = new CaseCodeCriteria();
        caseCode.setFilingNumber(TEST_FILING_NUMBER);
        caseCode.setCode("VALID_CODE");
        caseCodeRequest.setCode(caseCode);
        caseCodeRequest.setRequestInfo(requestInfo);

        CourtCase courtCase = new CourtCase();
        courtCase.setAccessCode("VALID_CODE");
        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase);
        List<CaseCriteria> existingApplications = Collections.singletonList(caseCriteria);

        when(caseRepository.getCases(any(), any())).thenReturn(existingApplications);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(courtCase);

        // Execute
        CaseCodeResponse response = caseService.verifyJoinCaseCodeV2Request(caseCodeRequest);

        // Verify
        assertNotNull(response);
        assertTrue(response.getIsValid());
        verify(caseRepository, times(1)).getCases(any(), any());
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
    }

    @Test
    void testVerifyJoinCaseCodeV2Request_InvalidAccessCode() {
        // Setup
        CaseCodeRequest caseCodeRequest = new CaseCodeRequest();
        CaseCodeCriteria caseCode = new CaseCodeCriteria();
        caseCode.setFilingNumber(TEST_FILING_NUMBER);
        caseCode.setCode("INVALID_CODE");
        caseCodeRequest.setCode(caseCode);
        caseCodeRequest.setRequestInfo(requestInfo);

        CourtCase courtCase = new CourtCase();
        courtCase.setAccessCode("VALID_CODE");
        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase);
        List<CaseCriteria> existingApplications = Collections.singletonList(caseCriteria);

        when(caseRepository.getCases(any(), any())).thenReturn(existingApplications);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(courtCase);

        // Execute
        CaseCodeResponse response = caseService.verifyJoinCaseCodeV2Request(caseCodeRequest);

        // Verify
        assertNotNull(response);
        assertFalse(response.getIsValid());
        verify(caseRepository, times(1)).getCases(any(), any());
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
    }

    @Test
    void testVerifyJoinCaseCodeV2Request_CaseDoesNotExist() {
        // Setup
        CaseCodeRequest caseCodeRequest = new CaseCodeRequest();
        CaseCodeCriteria caseCode = new CaseCodeCriteria();
        caseCode.setFilingNumber(TEST_FILING_NUMBER);
        caseCode.setCode("SOME_CODE");
        caseCodeRequest.setCode(caseCode);
        caseCodeRequest.setRequestInfo(requestInfo);

        when(caseRepository.getCases(any(), any())).thenReturn(Collections.emptyList());

        // Execute & Verify
        CustomException exception = assertThrows(CustomException.class, () -> caseService.verifyJoinCaseCodeV2Request(caseCodeRequest));
        assertEquals(CASE_EXIST_ERR, exception.getCode());
        assertEquals("Case does not exist", exception.getMessage());
        verify(caseRepository, times(1)).getCases(any(), any());
    }

    @Test
    void testVerifyJoinCaseCodeV2Request_CaseHasNoAccessCode() {
        // Setup
        CaseCodeRequest caseCodeRequest = new CaseCodeRequest();
        CaseCodeCriteria caseCode = new CaseCodeCriteria();
        caseCode.setFilingNumber(TEST_FILING_NUMBER);
        caseCode.setCode("SOME_CODE");
        caseCodeRequest.setCode(caseCode);
        caseCodeRequest.setRequestInfo(requestInfo);

        CourtCase courtCase = new CourtCase();
        courtCase.setAccessCode(null); // No access code set
        CaseCriteria caseCriteria = setupTestCaseCriteria(courtCase);
        List<CaseCriteria> existingApplications = Collections.singletonList(caseCriteria);

        when(caseRepository.getCases(any(), any())).thenReturn(existingApplications);
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(courtCase);

        // Execute & Verify
        CustomException exception = assertThrows(CustomException.class, () -> caseService.verifyJoinCaseCodeV2Request(caseCodeRequest));
        assertEquals(VALIDATION_ERR, exception.getCode());
        assertEquals("Access code not generated", exception.getMessage());
        verify(caseRepository, times(1)).getCases(any(), any());
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
    }

    @Test
    void testVerifyJoinCaseCodeV2Request_ExceptionHandling() {
        // Setup
        CaseCodeRequest caseCodeRequest = new CaseCodeRequest();
        CaseCodeCriteria caseCode = new CaseCodeCriteria();
        caseCode.setFilingNumber(TEST_FILING_NUMBER);
        caseCode.setCode("SOME_CODE");
        caseCodeRequest.setCode(caseCode);
        caseCodeRequest.setRequestInfo(requestInfo);

        when(caseRepository.getCases(any(), any())).thenThrow(new RuntimeException("Database error"));

        // Execute & Verify
        CustomException exception = assertThrows(CustomException.class, () -> caseService.verifyJoinCaseCodeV2Request(caseCodeRequest));
        assertEquals(JOIN_CASE_ERR, exception.getCode());
        assertEquals(JOIN_CASE_CODE_INVALID_REQUEST, exception.getMessage());
        verify(caseRepository, times(1)).getCases(any(), any());
    }

}
