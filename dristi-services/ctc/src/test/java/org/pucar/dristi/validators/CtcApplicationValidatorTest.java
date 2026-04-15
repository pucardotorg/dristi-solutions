package org.pucar.dristi.validators;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.courtcase.AdvocateMapping;
import org.pucar.dristi.web.models.courtcase.CourtCase;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtcApplicationValidatorTest {

    @Mock private CaseUtil caseUtil;
    @Spy  private ObjectMapper objectMapper = new ObjectMapper();
    @Mock private CtcApplicationRepository repository;
    @Mock private Configuration configuration;

    @InjectMocks
    private CtcApplicationValidator validator;

    private RequestInfo requestInfo;
    private CtcApplication application;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder()
                        .uuid("user-1")
                        .roles(new ArrayList<>(List.of(Role.builder().code("CITIZEN").tenantId("pb").build())))
                        .build())
                .build();

        application = CtcApplication.builder()
                .id("app-1")
                .ctcApplicationNumber("CA-001")
                .tenantId("pb")
                .courtId("KLKM52")
                .filingNumber("FIL-001")
                .build();
    }

    // ---- validateCreateRequest tests ----

    @Test
    void validateCreateRequest_shouldThrowWhenRequestIsNull() {
        assertThrows(CustomException.class, () -> validator.validateCreateRequest(null));
    }

    @Test
    void validateCreateRequest_shouldThrowWhenApplicationIsNull() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(null).build();

        assertThrows(CustomException.class, () -> validator.validateCreateRequest(request));
    }

    @Test
    void validateCreateRequest_shouldCallValidateAndEnrichUser() {
        CourtCase courtCase = new CourtCase();
        when(caseUtil.getCase("FIL-001", "KLKM52", requestInfo)).thenReturn(courtCase);
        when(caseUtil.extractComplainantUuids(courtCase)).thenReturn(Map.of("user-1", "John"));

        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        validator.validateCreateRequest(request);

        assertEquals("John", application.getApplicantName());
        assertEquals("Complainant", application.getPartyDesignation());
        assertTrue(application.getIsPartyToCase());
    }

    // ---- validateUpdateRequest tests ----

    @Test
    void validateUpdateRequest_shouldThrowWhenApplicationNumberIsNull() {
        application.setCtcApplicationNumber(null);
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        assertThrows(CustomException.class, () -> validator.validateUpdateRequest(request,new ArrayList<>()));
    }

    @Test
    void validateUpdateRequest_shouldThrowWhenApplicationNumberIsEmpty() {
        application.setCtcApplicationNumber("");
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        assertThrows(CustomException.class, () -> validator.validateUpdateRequest(request,new ArrayList<>()));
    }

    @Test
    void validateUpdateRequest_shouldThrowWhenApplicationNotFound() {
        when(repository.getCtcApplication(any())).thenReturn(Collections.emptyList());

        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        assertThrows(CustomException.class, () -> validator.validateUpdateRequest(request,new ArrayList<>()));
    }

    @Test
    void validateUpdateRequest_shouldPreserveExistingIsPartyToCase() {
        CtcApplication existing = CtcApplication.builder()
                .isPartyToCase(true)
                .caseBundles(List.of(CaseBundleNode.builder().id("cb-1").build()))
                .build();
        when(repository.getCtcApplication(any())).thenReturn(List.of(existing));

        application.setIsPartyToCase(false); // different from existing
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        validator.validateUpdateRequest(request,new ArrayList<>());

        assertTrue(application.getIsPartyToCase()); // should be preserved from existing
        assertNotNull(application.getCaseBundles());
    }

    // ---- validateAndEnrichUser tests ----

    @Test
    void validateAndEnrichUser_shouldSetNotPartyWhenCaseNotFound() {
        when(caseUtil.getCase(anyString(), anyString(), any())).thenReturn(null);
        when(configuration.getOutsiderDesignation()).thenReturn("Outside Petitioner");

        validator.validateAndEnrichUser(requestInfo, application);

        assertFalse(application.getIsPartyToCase());
        assertEquals("Outside Petitioner", application.getPartyDesignation());
    }

    @Test
    void validateAndEnrichUser_shouldMatchComplainant() {
        CourtCase courtCase = new CourtCase();
        when(caseUtil.getCase("FIL-001", "KLKM52", requestInfo)).thenReturn(courtCase);
        when(caseUtil.extractComplainantUuids(courtCase)).thenReturn(Map.of("user-1", "John Doe"));

        validator.validateAndEnrichUser(requestInfo, application);

        assertEquals("John Doe", application.getApplicantName());
        assertEquals("Complainant", application.getPartyDesignation());
        assertTrue(application.getIsPartyToCase());
    }

    @Test
    void validateAndEnrichUser_shouldMatchRespondent() {
        CourtCase courtCase = new CourtCase();
        when(caseUtil.getCase("FIL-001", "KLKM52", requestInfo)).thenReturn(courtCase);
        when(caseUtil.extractComplainantUuids(courtCase)).thenReturn(Collections.emptyMap());
        when(caseUtil.extractRespondentUuids(courtCase)).thenReturn(Map.of("user-1", "Jane"));

        validator.validateAndEnrichUser(requestInfo, application);

        assertEquals("Jane", application.getApplicantName());
        assertEquals("Accused", application.getPartyDesignation());
        assertTrue(application.getIsPartyToCase());
    }

    @Test
    void validateAndEnrichUser_shouldFallbackToPoaForCitizen() {
        CourtCase courtCase = new CourtCase();
        when(caseUtil.getCase("FIL-001", "KLKM52", requestInfo)).thenReturn(courtCase);
        when(caseUtil.extractComplainantUuids(courtCase)).thenReturn(Collections.emptyMap());
        when(caseUtil.extractRespondentUuids(courtCase)).thenReturn(Collections.emptyMap());
        when(caseUtil.extractPoaHolderUuids(courtCase)).thenReturn(Map.of("user-1", "POA Holder"));

        validator.validateAndEnrichUser(requestInfo, application);

        assertEquals("POA Holder", application.getApplicantName());
        assertEquals("POA", application.getPartyDesignation());
        assertTrue(application.getIsPartyToCase());
    }

    @Test
    void validateAndEnrichUser_shouldMatchAdvocateRole() {
        requestInfo.getUserInfo().setRoles(new ArrayList<>(List.of(
                Role.builder().code("ADVOCATE_ROLE").tenantId("pb").build()
        )));

        CourtCase courtCase = new CourtCase();

        ObjectNode additionalDetails = objectMapper.createObjectNode();
        additionalDetails.put("advocateName", "Adv. Smith");
        additionalDetails.put("uuid", "user-1");

        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdditionalDetails(additionalDetails);
        courtCase.setRepresentatives(List.of(advocateMapping));

        when(caseUtil.getCase("FIL-001", "KLKM52", requestInfo)).thenReturn(courtCase);

        validator.validateAndEnrichUser(requestInfo, application);

        assertEquals("Adv. Smith", application.getApplicantName());
        assertEquals("Advocate", application.getPartyDesignation());
        assertTrue(application.getIsPartyToCase());
    }

    @Test
    void validateAndEnrichUser_shouldFallbackToPoaForAdvocate() {
        requestInfo.getUserInfo().setRoles(new ArrayList<>(List.of(
                Role.builder().code("ADVOCATE_ROLE").tenantId("pb").build()
        )));

        CourtCase courtCase = new CourtCase();
        courtCase.setRepresentatives(Collections.emptyList());
        when(caseUtil.getCase("FIL-001", "KLKM52", requestInfo)).thenReturn(courtCase);
        when(caseUtil.extractPoaHolderUuids(courtCase)).thenReturn(Map.of("user-1", "POA Person"));

        validator.validateAndEnrichUser(requestInfo, application);

        assertEquals("POA Person", application.getApplicantName());
        assertEquals("POA", application.getPartyDesignation());
        assertTrue(application.getIsPartyToCase());
    }

    @Test
    void validateAndEnrichUser_shouldThrowOnException() {
        when(caseUtil.getCase(anyString(), anyString(), any())).thenThrow(new RuntimeException("case error"));

        assertThrows(CustomException.class, () -> validator.validateAndEnrichUser(requestInfo, application));
    }
}
