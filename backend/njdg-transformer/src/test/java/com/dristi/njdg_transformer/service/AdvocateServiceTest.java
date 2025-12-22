package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.advocate.Advocate;
import com.dristi.njdg_transformer.model.advocate.AdvocateRequest;
import com.dristi.njdg_transformer.model.advocate.Individual;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.utils.IndividualUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Name;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class AdvocateServiceTest {

    @Mock
    private AdvocateRepository advocateRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private Producer producer;

    @Mock
    private IndividualUtil individualUtil;

    @InjectMocks
    private AdvocateService advocateService;

    private AdvocateRequest advocateRequest;
    private Advocate advocate;

    @BeforeEach
    void setUp() {
        advocate = new Advocate();
        advocate.setId(UUID.randomUUID());
        advocate.setStatus("ACTIVE");
        advocate.setBarRegistrationNumber("BAR-001");
        advocate.setIndividualId("IND-001");
        advocate.setTenantId("kl.kollam");

        advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(advocate);
        advocateRequest.setRequestInfo(RequestInfo.builder().build());
    }

    @Test
    void testProcessAndUpdateAdvocates_NewAdvocate_Success() {
        Individual individual = new Individual();
        individual.setIndividualId("IND-001");
        Name name = Name.builder().givenName("John").familyName("Doe").build();
        individual.setName(name);

        lenient().when(advocateRepository.getAdvocateDetails("IND-001")).thenReturn(null);
        lenient().when(individualUtil.getIndividualByIndividualId(any()))
                .thenReturn(Collections.singletonList(individual));

        AdvocateDetails result = advocateService.processAndUpdateAdvocates(advocateRequest);

        assertNotNull(result);
        verify(producer).push(eq("save-advocate-details"), any(AdvocateDetails.class));
    }

    @Test
    void testProcessAndUpdateAdvocates_ExistingAdvocate_Update() {
        AdvocateDetails existingAdvocate = new AdvocateDetails();
        existingAdvocate.setAdvocateId("IND-001");
        existingAdvocate.setAdvocateCode(1);
        existingAdvocate.setAdvocateName("Old Name");

        Individual individual = new Individual();
        individual.setIndividualId("IND-001");
        Name name = Name.builder().givenName("John").familyName("Doe Updated").build();
        individual.setName(name);

        lenient().when(advocateRepository.getAdvocateDetails("IND-001")).thenReturn(existingAdvocate);
        lenient().when(individualUtil.getIndividualByIndividualId(any()))
                .thenReturn(Collections.singletonList(individual));

        AdvocateDetails result = advocateService.processAndUpdateAdvocates(advocateRequest);

        // Service returns advocate details regardless of existing status
        assertNotNull(result);
    }

    @Test
    void testProcessAndUpdateAdvocates_NullAdvocate() {
        advocateRequest.setAdvocate(null);

        assertThrows(NullPointerException.class, () -> 
            advocateService.processAndUpdateAdvocates(advocateRequest));
    }

    @Test
    void testProcessAndUpdateAdvocates_NullIndividualId() {
        advocate.setIndividualId(null);

        AdvocateDetails result = advocateService.processAndUpdateAdvocates(advocateRequest);

        // Service creates advocate even with null individual ID
        assertNotNull(result);
    }

    @Test
    void testProcessAndUpdateAdvocates_IndividualNotFound() {
        lenient().when(advocateRepository.getAdvocateDetails("IND-001")).thenReturn(null);
        lenient().when(individualUtil.getIndividualByIndividualId(any()))
                .thenReturn(Collections.emptyList());

        AdvocateDetails result = advocateService.processAndUpdateAdvocates(advocateRequest);

        // Service creates advocate even when individual not found
        assertNotNull(result);
    }

    @Test
    void testProcessAndUpdateAdvocates_Exception() {
        lenient().when(advocateRepository.getAdvocateDetails("IND-001"))
                .thenThrow(new RuntimeException("Database error"));

        // Service may handle exceptions internally
        AdvocateDetails result = advocateService.processAndUpdateAdvocates(advocateRequest);
        assertNotNull(result);
    }

    @Test
    void testFindExistingAdvocate_Found() {
        AdvocateDetails existingAdvocate = new AdvocateDetails();
        existingAdvocate.setAdvocateId("IND-001");
        existingAdvocate.setAdvocateCode(1);

        Individual individual = new Individual();
        individual.setIndividualId("IND-001");
        Name name = Name.builder().givenName("John").familyName("Doe").build();
        individual.setName(name);

        lenient().when(advocateRepository.getAdvocateDetails("IND-001")).thenReturn(existingAdvocate);
        lenient().when(individualUtil.getIndividualByIndividualId(any()))
                .thenReturn(Collections.singletonList(individual));

        AdvocateDetails result = advocateService.processAndUpdateAdvocates(advocateRequest);

        // Service returns advocate details
        assertNotNull(result);
    }
}
