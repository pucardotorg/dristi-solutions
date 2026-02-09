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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.common.models.individual.Name;
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
import org.pucar.dristi.repository.AdvocateOfficeCaseMemberRepository;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validators.CaseRegistrationValidator;
import org.pucar.dristi.validators.EvidenceValidator;
import org.pucar.dristi.web.OpenApiCaseSummary;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.task.Task;
import org.pucar.dristi.web.models.task.TaskRequest;
import org.pucar.dristi.web.models.task.TaskResponse;
import org.pucar.dristi.web.models.v2.WitnessDetails;
import org.pucar.dristi.web.models.v2.WitnessDetailsRequest;
import org.pucar.dristi.web.models.v2.WitnessDetailsResponse;
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
    private UserService userService;

    @Mock
    private HearingUtil hearingUtil;

    @Mock
    private EnrichmentService enrichmentService;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private EvidenceUtil evidenceUtil;

    @Mock
    private EvidenceValidator evidenceValidator;

    @Mock
    private PaymentCalculaterUtil paymentCalculaterUtil;

    @Mock
    private EtreasuryUtil etreasuryUtil;


    @InjectMocks
    private CaseService caseService;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private FileStoreUtil fileStoreUtil;

    @Mock
    private DateUtil dateUtil;

    @Mock
    private InboxUtil inboxUtil;

    @Mock
    private AdvocateOfficeCaseMemberRepository advocateOfficeCaseMemberRepository;

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

    private JoinCaseV2Request joinCaseV2Request;
    private JoinCaseDataV2 joinCaseData;
    private CourtCase existingCourtCaseEncrypted;
    private CourtCase existingCourtCaseDecrypted;
    private CaseCriteria caseCriteriaFound;


    private final String FILING_NUMBER = "CASE-2024-001";
    private final String TENANT_ID = "pg.citya";
    private final String ACCESS_CODE = "123456";
    private final UUID CASE_ID = UUID.randomUUID();
    private final String LITIGANT_INDIVIDUAL_ID = "litigant-uuid-1";
    private final String ADVOCATE_ID = "adv-bar-reg-1";
    private final String ADVOCATE_INDIVIDUAL_ID = "advocate-uuid-1";
    private final String REPRESENTING_INDIVIDUAL_ID = "representing-uuid-1";


    @BeforeEach
    void setUp() {
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
        userInfo.setUuid("ba8767a6-7cb1-416b-803e-19cf9dca06bc");
        userInfo.setType("employee");
        userInfo.setTenantId("tenant-id");
        Role role = new Role();
        role.setName("employee");
        userInfo.setRoles(Collections.singletonList(role));
        // Initialize mocks and create necessary objects for the tests
        joinCaseRequest = new JoinCaseRequest();
        joinCaseRequest.setAdditionalDetails("form-data");
        courtCase = new CourtCase();
        objectMapper = new ObjectMapper();
        enrichmentService = new EnrichmentService(new ArrayList<>());
        OrderUtil orderUtil = new OrderUtil(null, null, null);
        caseService = new CaseService(validator,enrichmentUtil,caseRepository,workflowService,config,producer,taskUtil,etreasuryUtil,encryptionDecryptionUtil, hearingUtil,userService,paymentCalculaterUtil,objectMapper,cacheService,enrichmentService, notificationService, individualService, advocateUtil, evidenceUtil, evidenceValidator,caseUtil,fileStoreUtil, orderUtil, dateUtil,inboxUtil, advocateOfficeCaseMemberRepository);

        requestInfo = RequestInfo.builder()
                .userInfo(User.builder().uuid("ba8767a6-7cb1-416b-803e-19cf9dca06bc").tenantId(TENANT_ID).build())
                .build();

        caseSearchRequest.setRequestInfo(requestInfo);

        joinCaseData = JoinCaseDataV2.builder()
                .filingNumber(FILING_NUMBER)
                .tenantId(TENANT_ID)
                .accessCode(ACCESS_CODE)
                .build();

        joinCaseV2Request = JoinCaseV2Request.builder()
                .requestInfo(requestInfo)
                .joinCaseData(joinCaseData)
                .build();

        // Mock encrypted case (as stored in DB/Cache)
        existingCourtCaseEncrypted = CourtCase.builder()
                .id(CASE_ID)
                .filingNumber(FILING_NUMBER)
                .tenantId(TENANT_ID)
                // Assume other fields are encrypted blobs/strings
                .build();

        // Mock decrypted case (after decryption util)
        existingCourtCaseDecrypted = CourtCase.builder()
                .id(CASE_ID)
                .filingNumber(FILING_NUMBER)
                .tenantId(TENANT_ID)
                .accessCode(ACCESS_CODE) // Crucial for validation
                .litigants(new ArrayList<>()) // Initialize lists
                .representatives(new ArrayList<>())
                .pendingAdvocateRequests(new ArrayList<>())
                .additionalDetails(new HashMap<>()) // Initialize map
                .build();

        caseCriteriaFound = CaseCriteria.builder()
                .filingNumber(FILING_NUMBER)
                .responseList(Collections.singletonList(existingCourtCaseEncrypted))
                .build();

        // Common mocking for decryption
        lenient().when(encryptionDecryptionUtil.decryptObject(
                        eq(existingCourtCaseEncrypted),
                        any(), // or eq(config.getCaseDecryptSelf()) if config mock is set up
                        eq(CourtCase.class),
                        eq(requestInfo)))
                .thenReturn(existingCourtCaseDecrypted);

        // Common mocking for repository
        lenient().when(caseRepository.getCases(anyList(), eq(requestInfo)))
                .thenReturn(Collections.singletonList(caseCriteriaFound));

        // Common mocking for encryption (used in helper methods like addLitigantToCase)
        lenient().when(encryptionDecryptionUtil.encryptObject(any(CourtCase.class), any(), eq(CourtCase.class)))
                .thenAnswer(invocation -> invocation.getArgument(0)); // Return the input object for simplicity
    }

    // --- Test Cases ---

    @Test
    void testProcessJoinCaseRequest_LitigantJoin_Success() {
        // Arrange
        JoinCaseLitigant newLitigant = JoinCaseLitigant.builder()
                .individualId(LITIGANT_INDIVIDUAL_ID)
                .partyType("complainant")
                .isActive(true)
                .isPip(false)
                .build();
        joinCaseData.setLitigant(Collections.singletonList(newLitigant));
        joinCaseData.setRepresentative(null); // Ensure only litigant join

        when(validator.validateLitigantJoinCase(joinCaseV2Request)).thenReturn(true);
        when(individualService.getIndividualsByIndividualId(any(), eq(LITIGANT_INDIVIDUAL_ID))).thenReturn(Collections.singletonList(Individual.builder().userUuid("rep-user-uuid").name(Name.builder().givenName("Rep").build()).mobileNumber("22222").build()));

        // Mock dependencies called within addLitigantToCase if necessary
        // For simplicity, assume addLitigantToCase works and verify producer calls

        // Act
        JoinCaseV2Response response = caseService.processJoinCaseRequest(joinCaseV2Request);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsVerified());
        assertNull(response.getPaymentTaskNumber());

        // Verify key interactions
        verify(caseRepository, times(1)).getCases(anyList(), eq(requestInfo));
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
        verify(validator, times(1)).validateLitigantJoinCase(joinCaseV2Request);
        // Verify calls inside addLitigantToCase (simplified)
        verify(cacheService, times(1)).save(anyString(), any());
        verify(producer, times(1)).push(eq(config.getJoinCaseTopicIndexer()), any(CaseRequest.class));
    }

    @Test
    void testProcessJoinCaseRequest_AdvocateJoin_NoPayment_Success() {
        // Arrange
        RepresentingJoinCase representing = RepresentingJoinCase.builder()
                .individualId(REPRESENTING_INDIVIDUAL_ID)
                .noOfAdvocates(1)
                .build();
        JoinCaseRepresentative representative = JoinCaseRepresentative.builder()
                .advocateId(ADVOCATE_ID)
                .representing(Collections.singletonList(representing))
                .isReplacing(false)
                .build();
        joinCaseData.setRepresentative(representative);
        JoinCaseLitigant newLitigant = JoinCaseLitigant.builder()
                .individualId(REPRESENTING_INDIVIDUAL_ID)
                .partyType("respondent")
                .isActive(true)
                .isPip(false)
                .build();
        joinCaseData.setLitigant(Collections.singletonList(newLitigant)); // Ensure only advocate join
        when(validator.validateLitigantJoinCase(joinCaseV2Request)).thenReturn(true);

        // Mock validation and payment calculation
        when(validator.validateRepresentativeJoinCase(joinCaseV2Request)).thenReturn(true);
        when(paymentCalculaterUtil.callPaymentCalculator(any(JoinCasePaymentRequest.class)))
                .thenReturn(CalculationRes.builder().calculation(Collections.emptyList()).build()); // No payment

        // Mock advocate/individual fetching needed by addAdvocateToCase/joinCaseNotifications
        when(advocateUtil.fetchAdvocatesById(any(), anyString())).thenReturn(Collections.singletonList(Advocate.builder().individualId(ADVOCATE_INDIVIDUAL_ID).build()));
        when(individualService.getIndividualsByIndividualId(any(), eq(ADVOCATE_INDIVIDUAL_ID))).thenReturn(Collections.singletonList(Individual.builder().userUuid("adv-user-uuid").name(Name.builder().givenName("Adv").build()).mobileNumber("11111").build()));
        when(individualService.getIndividualsByIndividualId(any(), eq(REPRESENTING_INDIVIDUAL_ID))).thenReturn(Collections.singletonList(Individual.builder().userUuid("rep-user-uuid").name(Name.builder().givenName("Rep").build()).mobileNumber("22222").build()));
        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.emptyList()); // Assume no hearings for simplicity

        // Act
        JoinCaseV2Response response = caseService.processJoinCaseRequest(joinCaseV2Request);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsVerified());
        assertNull(response.getPaymentTaskNumber());

        // Verify key interactions
        verify(caseRepository, times(1)).getCases(anyList(), eq(requestInfo));
        verify(validator, times(1)).validateRepresentativeJoinCase(joinCaseV2Request);
        verify(paymentCalculaterUtil, times(1)).callPaymentCalculator(any(JoinCasePaymentRequest.class));
        verify(taskUtil, never()).callCreateTask(any()); // No task creation
        verify(etreasuryUtil, never()).createDemand(any(), anyString(), anyList()); // No demand creation
    }

    @Test
    void testProcessJoinCaseRequest_AdvocateJoin_PaymentRequired_Success() {
        // Arrange
        RepresentingJoinCase representing = RepresentingJoinCase.builder()
                .individualId(REPRESENTING_INDIVIDUAL_ID)
                .noOfAdvocates(1)
                .build();
        JoinCaseRepresentative representative = JoinCaseRepresentative.builder()
                .advocateId(ADVOCATE_ID)
                .representing(Collections.singletonList(representing))
                .isReplacing(false)
                .build();
        joinCaseData.setRepresentative(representative);
        joinCaseData.setLitigant(null);

        // Mock validation and payment calculation
        when(validator.validateRepresentativeJoinCase(joinCaseV2Request)).thenReturn(true);
        Calculation calculation = Calculation.builder().totalAmount(100.0).breakDown(new ArrayList<>()).build(); // Payment required
        when(paymentCalculaterUtil.callPaymentCalculator(any(JoinCasePaymentRequest.class)))
                .thenReturn(CalculationRes.builder().calculation(Collections.singletonList(calculation)).build());

        // Mock task and demand creation
        String expectedTaskNumber = "TASK-123";
        Task createdTask = Task.builder().taskNumber(expectedTaskNumber).taskDetails(Map.of("consumerCode", FILING_NUMBER + "_JOIN")).build();
        when(taskUtil.callCreateTask(any(TaskRequest.class)))
                .thenReturn(TaskResponse.builder().task(createdTask).build());
        doNothing().when(etreasuryUtil).createDemand(any(), anyString(), anyList());

        // Act
        JoinCaseV2Response response = caseService.processJoinCaseRequest(joinCaseV2Request);

        // Assert
        assertNotNull(response);
       // assertFalse(response.getIsVerified()); // Should be false when payment task is created
        assertEquals(expectedTaskNumber, response.getPaymentTaskNumber());

        // Verify key interactions
        verify(caseRepository, times(1)).getCases(anyList(), eq(requestInfo));
        verify(validator, times(1)).validateRepresentativeJoinCase(joinCaseV2Request);
        verify(paymentCalculaterUtil, times(1)).callPaymentCalculator(any(JoinCasePaymentRequest.class));
        verify(taskUtil, times(1)).callCreateTask(any(TaskRequest.class));
        verify(etreasuryUtil, times(1)).createDemand(any(), eq(FILING_NUMBER + "_JOIN"), anyList());
        verify(producer, never()).push(eq(config.getRepresentativeJoinCaseTopic()), any()); // Shouldn't push advocate data yet
        verify(notificationService, never()).sendNotification(any(), any(), anyString(), anyString()); // No notifications yet
    }

    @Test
    void testProcessJoinCaseRequest_CaseNotFound() {
        // Arrange
        when(caseRepository.getCases(anyList(), eq(requestInfo)))
                .thenReturn(Collections.singletonList(CaseCriteria.builder().responseList(Collections.emptyList()).build())); // Case not found

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.processJoinCaseRequest(joinCaseV2Request);
        });

        assertEquals(CASE_EXIST_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("Case does not exist"));
        verify(encryptionDecryptionUtil, never()).decryptObject(any(), any(), any(), any());
    }

    @Test
    void testProcessJoinCaseRequest_InvalidAccessCode() {
        // Arrange
        existingCourtCaseDecrypted.setAccessCode("WRONG_CODE"); // Set incorrect access code in decrypted object
        // Ensure decryption mock returns this modified object
        when(encryptionDecryptionUtil.decryptObject(any(), any(), any(), any())).thenReturn(existingCourtCaseDecrypted);


        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.processJoinCaseRequest(joinCaseV2Request);
        });

        assertEquals(VALIDATION_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("Invalid access code"));
        verify(caseRepository, times(1)).getCases(anyList(), eq(requestInfo));
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
    }

    @Test
    void testProcessJoinCaseRequest_LitigantAlreadyExists() {
        // Arrange
        // Add the litigant to the existing case
        Party existingLitigant = Party.builder().individualId(LITIGANT_INDIVIDUAL_ID).isActive(true).build();
        existingCourtCaseDecrypted.getLitigants().add(existingLitigant);

        JoinCaseLitigant newLitigant = JoinCaseLitigant.builder()
                .individualId(LITIGANT_INDIVIDUAL_ID) // Same ID
                .partyType("complainant")
                .isActive(true)
                .isPip(false) // Not PIP
                .build();
        joinCaseData.setLitigant(Collections.singletonList(newLitigant));
        joinCaseData.setRepresentative(null);

        when(validator.validateLitigantJoinCase(joinCaseV2Request)).thenReturn(true);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.processJoinCaseRequest(joinCaseV2Request);
        });

        assertEquals(VALIDATION_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("Litigant is already a part of the given case"));

        verify(caseRepository, times(1)).getCases(anyList(), eq(requestInfo));
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
        verify(validator, times(1)).validateLitigantJoinCase(joinCaseV2Request);
        verify(producer, never()).push(anyString(), any()); // Should fail before pushing
    }

    @Test
    void testProcessJoinCaseRequest_AdvocateAlreadyRepresenting() {
        // Arrange
        // Add the advocate and representation to the existing case
        Party existingRepresentation = Party.builder().individualId(REPRESENTING_INDIVIDUAL_ID).isActive(true).build();
        AdvocateMapping existingAdvocate = AdvocateMapping.builder()
                .advocateId(ADVOCATE_ID) // Same advocate
                .representing(Collections.singletonList(existingRepresentation))
                .isActive(true)
                .build();
        existingCourtCaseDecrypted.getRepresentatives().add(existingAdvocate);

        // Prepare request for the same advocate representing the same individual
        RepresentingJoinCase representing = RepresentingJoinCase.builder()
                .individualId(REPRESENTING_INDIVIDUAL_ID) // Same individual
                .noOfAdvocates(1)
                .build();
        JoinCaseRepresentative representative = JoinCaseRepresentative.builder()
                .advocateId(ADVOCATE_ID) // Same advocate
                .representing(Collections.singletonList(representing))
                .isReplacing(false)
                .build();
        joinCaseData.setRepresentative(representative);
        joinCaseData.setLitigant(null);

        when(validator.validateRepresentativeJoinCase(joinCaseV2Request)).thenReturn(true);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.processJoinCaseRequest(joinCaseV2Request);
        });

        // This exception comes from validateAdvocateAlreadyRepresenting
        assertEquals(VALIDATION_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("Advocate is already representing the individual"));

        verify(caseRepository, times(1)).getCases(anyList(), eq(requestInfo));
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(), any(), any(), any());
        verify(validator, times(1)).validateRepresentativeJoinCase(joinCaseV2Request);
        verify(paymentCalculaterUtil, never()).callPaymentCalculator(any(JoinCasePaymentRequest.class)); // Should fail before payment calc
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
    public void updateCaseWithoutWorkflowSuccess() {
        // Setup test data
        CaseRequest caseRequest = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseRequest.setRequestInfo(requestInfo);
        
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setTenantId("pb.amritsar");
        courtCase.setCaseNumber("CASE-2024-001");
        caseRequest.setCases(courtCase);

        // Mock encryption
        CourtCase encryptedCourtCase = new CourtCase();
        encryptedCourtCase.setId(courtCase.getId());
        encryptedCourtCase.setTenantId(courtCase.getTenantId());
        when(encryptionDecryptionUtil.encryptObject(eq(caseRequest.getCases()), anyString(), eq(CourtCase.class)))
                .thenReturn(encryptedCourtCase);

        // Mock config
        when(config.getCourtCaseEncrypt()).thenReturn("case-encrypt-key");

        // Execute the method
        CourtCase result = caseService.updateCaseWithoutWorkflow(caseRequest);

        // Verify the result
        assertNotNull(result);
        assertEquals(courtCase.getId(), result.getId());
        assertEquals(courtCase.getTenantId(), result.getTenantId());
        assertEquals(courtCase.getCaseNumber(), result.getCaseNumber());

        // Verify interactions
        verify(encryptionDecryptionUtil).encryptObject(eq(caseRequest.getCases()), eq("case-encrypt-key"), eq(CourtCase.class));
    }

    @Test
    public void updateCaseWithoutWorkflowFailureNullCourtCase() {
        // Setup test data with null court case
        CaseRequest caseRequest = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseRequest.setRequestInfo(requestInfo);
        caseRequest.setCases(null); // Null court case

        // Execute and verify exception
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.updateCaseWithoutWorkflow(caseRequest);
        });

        // Verify exception details
        assertEquals(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("CourtCase cannot be null"));

        // Verify no interactions with other services
        verifyNoInteractions(encryptionDecryptionUtil);
        verifyNoInteractions(cacheService);
    }

    @Test
    public void updateCaseWithoutWorkflowFailureNullTenantId() {
        // Setup test data with null tenant ID
        CaseRequest caseRequest = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseRequest.setRequestInfo(requestInfo);
        
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setTenantId(null); // Null tenant ID
        caseRequest.setCases(courtCase);

        // Execute and verify exception
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.updateCaseWithoutWorkflow(caseRequest);
        });

        // Verify exception details
        assertEquals(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("TenantId cannot be null or empty"));

        // Verify no interactions with other services
        verifyNoInteractions(encryptionDecryptionUtil);
        verifyNoInteractions(cacheService);
    }

    @Test
    public void updateCaseWithoutWorkflowFailureEmptyTenantId() {
        // Setup test data with empty tenant ID
        CaseRequest caseRequest = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseRequest.setRequestInfo(requestInfo);
        
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setTenantId(""); // Empty tenant ID
        caseRequest.setCases(courtCase);

        // Execute and verify exception
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.updateCaseWithoutWorkflow(caseRequest);
        });

        // Verify exception details
        assertEquals(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("TenantId cannot be null or empty"));

        // Verify no interactions with other services
        verifyNoInteractions(encryptionDecryptionUtil);
        verifyNoInteractions(cacheService);
    }

    @Test
    public void updateCaseWithoutWorkflowFailureNullCaseId() {
        // Setup test data with null case ID
        CaseRequest caseRequest = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseRequest.setRequestInfo(requestInfo);
        
        CourtCase courtCase = new CourtCase();
        courtCase.setId(null); // Null case ID
        courtCase.setTenantId("pb.amritsar");
        caseRequest.setCases(courtCase);

        // Execute and verify exception
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseService.updateCaseWithoutWorkflow(caseRequest);
        });

        // Verify exception details
        assertEquals(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("Case ID cannot be null or empty"));

        // Verify no interactions with other services
        verifyNoInteractions(encryptionDecryptionUtil);
        verifyNoInteractions(cacheService);
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
    public void testSearchRedisCache_CaseNotFound() {
        CaseCriteria criteria = new CaseCriteria();
        criteria.setCaseId("123");


        when(cacheService.findById(anyString())).thenReturn(null);

        CourtCase result = caseService.searchRedisCache(requestInfo, criteria.getCaseId());

        assertNull(result);
    }

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

    @Test
    void testExtractPowerOfAttorneyIds_IndividualId() {

        POAHolder poaHolders = new POAHolder();
        poaHolders.setIndividualId("IND-123");
        CourtCase courtCase = new CourtCase();

        courtCase.setPoaHolders(Collections.singletonList(poaHolders));

        Set<String> individualIds = new HashSet<>();
        individualIds.add("IND-123");
        Set<String> result = caseService.getPocHolderIndividualIdsOfLitigants(courtCase, individualIds);

        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertTrue(result.contains("IND-123"));
    }

    @Test
    void testAddWitnessToCase_Success() {
        // Setup
        WitnessDetailsRequest request = createWitnessDetailsRequest();
        CourtCase courtCase = createCourtCase();
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .responseList(Collections.singletonList(courtCase))
                .defaultFields(false)
                .build();
        
        // Mock dependencies
        when(caseRepository.getCases(any(), any())).thenReturn(List.of(caseCriteria));
        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), anyString(), eq(CourtCase.class), any()))
                .thenReturn(courtCase);
        when(encryptionDecryptionUtil.encryptObject(any(CourtCase.class), anyString(), eq(CourtCase.class)))
                .thenReturn(courtCase);
        when(config.getCaseDecryptSelf()).thenReturn("decrypt-key");
        when(config.getCourtCaseEncrypt()).thenReturn("encryption-key");
        when(config.getCaseUpdateTopic()).thenReturn("case-update-topic");
        doNothing().when(validator).validateWitnessRequest(any(), any());
        doNothing().when(cacheService).save(anyString(), any());
        doNothing().when(producer).push(anyString(), any());
        
        // Execute
        WitnessDetailsResponse response = caseService.addWitnessToCase(request);
        
        // Verify
        assertNotNull(response);
        assertNotNull(response.getWitnessDetails());
        assertEquals(request.getWitnessDetails().get(0).getFirstName(), response.getWitnessDetails().get(0).getFirstName());
        assertEquals(request.getWitnessDetails().get(0).getLastName(), response.getWitnessDetails().get(0).getLastName());
        
        verify(caseRepository, times(1)).getCases(any(), any());
        verify(encryptionDecryptionUtil, times(1)).decryptObject(any(CourtCase.class), anyString(), eq(CourtCase.class), any());
        verify(validator, times(1)).validateWitnessRequest(eq(request), any(CourtCase.class));
        verify(encryptionDecryptionUtil, times(1)).encryptObject(any(CourtCase.class), anyString(), eq(CourtCase.class));
        verify(cacheService, times(1)).save(anyString(), any(CourtCase.class));
        verify(producer, times(1)).push(eq("case-update-topic"), any(CaseRequest.class));
    }

    @Test
    void testAddWitnessToCase_CaseNotFound() {
        // Setup
        WitnessDetailsRequest request = createWitnessDetailsRequest();
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .responseList(Collections.emptyList())
                .defaultFields(false)
                .build();
        
        // Mock empty case list
        when(caseRepository.getCases(any(), any())).thenReturn(List.of(caseCriteria));

        // Execute & Verify
        CustomException exception = assertThrows(CustomException.class, () -> caseService.addWitnessToCase(request));
        
        assertEquals(ERROR_ADDING_WITNESS, exception.getCode());
        assertTrue(exception.getMessage().contains("Error while adding witness to case"));
        
        verify(caseRepository, times(1)).getCases(any(), any());
        verify(validator, never()).validateWitnessRequest(any(), any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testAddWitnessToCase_NullWitnessDetails() {
        // Setup
        WitnessDetailsRequest request = createWitnessDetailsRequest();
        request.setWitnessDetails(null);
        CourtCase courtCase = createCourtCase();
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .responseList(Collections.singletonList(courtCase))
                .defaultFields(false)
                .build();
        
        when(caseRepository.getCases(any(), any())).thenReturn(List.of(caseCriteria));
        when(encryptionDecryptionUtil.decryptObject(any(CourtCase.class), anyString(), eq(CourtCase.class), any()))
                .thenReturn(courtCase);
        when(encryptionDecryptionUtil.encryptObject(any(CourtCase.class), anyString(), eq(CourtCase.class)))
                .thenReturn(courtCase);
        when(config.getCaseDecryptSelf()).thenReturn("decrypt-key");
        when(config.getCourtCaseEncrypt()).thenReturn("encryption-key");
        when(config.getCaseUpdateTopic()).thenReturn("case-update-topic");
        doNothing().when(validator).validateWitnessRequest(any(), any());
        doNothing().when(cacheService).save(anyString(), any());
        doNothing().when(producer).push(anyString(), any());
        
        // Execute
        WitnessDetailsResponse response = caseService.addWitnessToCase(request);
        
        // Verify
        assertNotNull(response);
        assertNull(response.getWitnessDetails());
        
        verify(validator, times(1)).validateWitnessRequest(eq(request), any(CourtCase.class));
        verify(producer, times(1)).push(anyString(), any());
    }

    // Helper methods for test data creation
    private WitnessDetailsRequest createWitnessDetailsRequest() {
        WitnessDetails witnessDetails = new WitnessDetails();
        witnessDetails.setFirstName("John");
        witnessDetails.setLastName("Doe");
        witnessDetails.setMiddleName("Smith");
        witnessDetails.setUniqueId("witness-001");

        return WitnessDetailsRequest.builder()
                .requestInfo(requestInfo)
                .caseFilingNumber("CASE-2024-001")
                .tenantId("pb.amritsar")
                .witnessDetails(Collections.singletonList(witnessDetails))
                .build();
    }

    private CourtCase createCourtCase() {
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("CASE-2024-001");
        courtCase.setTenantId("pb.amritsar");
        courtCase.setAdditionalDetails(new HashMap<>());
        return courtCase;
    }


    @Test
    void testUpdateCaseConversion_CMPConversion_Success() {
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-001");
        courtCase.setCnrNumber("CNR-2024-001");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("CMP");
        courtCase.setCmpNumber("CMP-2024-001");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
        verify(dateUtil, times(1)).getEpochFromLocalDate(any());
    }

    @Test
    void testUpdateCaseConversion_STConversion_Success() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-002");
        courtCase.setCnrNumber("CNR-2024-002");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("ST");
        courtCase.setCmpNumber("CMP-2024-002");
        courtCase.setCourtCaseNumber("ST-2024-002");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
    }

    @Test
    void testUpdateCaseConversion_LPRConversion_Success() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-003");
        courtCase.setCnrNumber("CNR-2024-003");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("ST");
        courtCase.setIsLPRCase(true);
        courtCase.setCourtCaseNumber("ST-2024-003");
        courtCase.setLprNumber("LPR-2024-003");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
    }

    @Test
    void testUpdateCaseConversion_LPToSTConversion_Success() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-004");
        courtCase.setCnrNumber("CNR-2024-004");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("ST");
        courtCase.setIsLPRCase(false);
        courtCase.setLprNumber("LPR-2024-004");
        courtCase.setCourtCaseNumberBackup("ST-2024-004-BACKUP");
        courtCase.setCourtCaseNumber("ST-2024-004-NEW");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
    }

    @Test
    void testUpdateCaseConversion_NoMatchingConversionType() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-005");
        courtCase.setCnrNumber("CNR-2024-005");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("UNKNOWN");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert - should still push to Kafka even without conversion details set
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
    }

    @Test
    void testUpdateCaseConversion_ExceptionHandling() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-006");
        courtCase.setCaseType("CMP");
        courtCase.setCmpNumber("CMP-2024-006");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doThrow(new RuntimeException("Kafka error")).when(producer).push(anyString(), any());

        // Act - should not throw exception due to try-catch
        assertDoesNotThrow(() -> caseService.updateCaseConversion(caseRequest));

        // Assert
        verify(producer, times(1)).push(anyString(), any());
    }

    @Test
    void testUpdateCaseConversion_CMPWithNullCmpNumber_NoConversion() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-007");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("CMP");
        courtCase.setCmpNumber(null); // CMP number is null

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert - should push but without conversion details set (convertedFrom/To will be null)
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
    }

    @Test
    void testUpdateCaseConversion_STWithNullCourtCaseNumber_FallbackToLPRCheck() {
        // Arrange
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setFilingNumber("FILING-2024-008");
        courtCase.setTenantId("kl.kollam");
        courtCase.setCaseType("ST");
        courtCase.setCourtCaseNumber(null);
        courtCase.setIsLPRCase(true);
        courtCase.setLprNumber("LPR-2024-008");

        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCases(courtCase);
        caseRequest.setRequestInfo(requestInfo);

        when(dateUtil.getEpochFromLocalDate(any())).thenReturn(1702857600000L);
        when(config.getCaseConversionTopic()).thenReturn("case-conversion-topic");
        doNothing().when(producer).push(anyString(), any());

        // Act
        caseService.updateCaseConversion(caseRequest);

        // Assert - should match LPR case conversion (ST -> LP)
        verify(producer, times(1)).push(eq("case-conversion-topic"), any());
        verify(dateUtil, times(1)).getEpochFromLocalDate(any());
    }

}
