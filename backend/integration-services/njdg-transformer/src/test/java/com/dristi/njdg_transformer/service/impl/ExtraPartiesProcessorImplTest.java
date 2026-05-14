package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.enrichment.CaseEnrichment;
import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.ExtraAdvocateDetails;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.cases.AdvocateMapping;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.cases.Party;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExtraPartiesProcessorImplTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private AdvocateRepository advocateRepository;

    @Mock
    private Producer producer;

    @Mock
    private CaseEnrichment caseEnrichment;

    @InjectMocks
    private ExtraPartiesProcessorImpl extraPartiesProcessor;

    private CourtCase courtCase;
    private PartyDetails partyDetails;
    private AdvocateDetails advocateDetails;

    @BeforeEach
    void setUp() {
        courtCase = new CourtCase();
        courtCase.setCnrNumber("CNR-001");
        courtCase.setRepresentatives(new ArrayList<>());

        partyDetails = PartyDetails.builder()
                .partyId("IND-001")
                .partyName("Test Party")
                .partyType(PartyType.PET)
                .cino("CNR-001")
                .build();

        advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateId("ADV-001");
        advocateDetails.setAdvocateCode(123);
        advocateDetails.setAdvocateName("Test Advocate");
    }

    @Test
    void testProcessExtraParties_Success() {
        List<PartyDetails> complainantParties = Collections.singletonList(partyDetails);
        
        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(complainantParties);
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer).push(eq("save-extra-parties"), anyList());
    }

    @Test
    void testProcessExtraParties_NoParties() {
        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer, never()).push(eq("save-extra-parties"), anyList());
    }

    @Test
    void testProcessExtraParties_WithAdvocates() {
        partyDetails.setSrNo(1);
        partyDetails.setAdvCd(456); // Different from advocateDetails.getAdvocateCode()
        List<PartyDetails> complainantParties = Collections.singletonList(partyDetails);

        Party party = new Party();
        party.setIndividualId("IND-001");

        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ADV-001");
        advocateMapping.setRepresenting(Collections.singletonList(party));

        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(complainantParties);
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());
        when(caseRepository.getExtraAdvocateDetails(anyString(), anyInt())).thenReturn(Collections.emptyList());
        when(advocateRepository.getAdvocateDetails(anyString())).thenReturn(advocateDetails);

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer).push(eq("save-extra-parties"), anyList());
        verify(producer).push(eq("save-extra-advocate-details"), anyList());
    }

    @Test
    void testProcessExtraParties_Exception() {
        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class)))
                .thenThrow(new RuntimeException("Error fetching parties"));

        assertThrows(RuntimeException.class, () -> extraPartiesProcessor.processExtraParties(courtCase));
    }

    @Test
    void testProcessExtraParties_WithRespondents() {
        PartyDetails respondentParty = PartyDetails.builder()
                .partyId("IND-002")
                .partyName("Respondent Party")
                .partyType(PartyType.RES)
                .cino("CNR-001")
                .build();

        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.singletonList(respondentParty));
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer).push(eq("save-extra-parties"), anyList());
    }

    @Test
    void testProcessExtraParties_WithWitnesses() {
        PartyDetails witness = PartyDetails.builder()
                .partyId("WIT-001")
                .partyName("Witness")
                .partyType(PartyType.PET)
                .cino("CNR-001")
                .build();

        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.singletonList(witness));
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer).push(eq("save-extra-parties"), anyList());
    }

    @Test
    void testProcessActs_ThrowsUnsupportedOperationException() {
        assertThrows(UnsupportedOperationException.class, () -> extraPartiesProcessor.processActs(courtCase));
    }

    @Test
    void testProcessExtraParties_WithExistingAdvocate() {
        partyDetails.setSrNo(1);
        partyDetails.setAdvCd(456);
        List<PartyDetails> complainantParties = Collections.singletonList(partyDetails);

        Party party = new Party();
        party.setIndividualId("IND-001");

        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ADV-001");
        advocateMapping.setRepresenting(Collections.singletonList(party));

        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        ExtraAdvocateDetails existingAdvocate = ExtraAdvocateDetails.builder()
                .cino("CNR-001")
                .advCode(123)
                .partyNo(1)
                .build();

        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(complainantParties);
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());
        when(caseRepository.getExtraAdvocateDetails(anyString(), anyInt())).thenReturn(Collections.singletonList(existingAdvocate));
        when(advocateRepository.getAdvocateDetails(anyString())).thenReturn(advocateDetails);

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer).push(eq("save-extra-parties"), anyList());
        verify(producer).push(eq("save-extra-advocate-details"), anyList());
    }

    @Test
    void testProcessExtraParties_NullAdvocateDetails() {
        partyDetails.setSrNo(1);
        partyDetails.setAdvCd(456);
        List<PartyDetails> complainantParties = Collections.singletonList(partyDetails);

        Party party = new Party();
        party.setIndividualId("IND-001");

        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ADV-001");
        advocateMapping.setRepresenting(Collections.singletonList(party));

        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        when(caseEnrichment.getComplainantExtraParties(any(CourtCase.class))).thenReturn(complainantParties);
        when(caseEnrichment.getRespondentExtraParties(any(CourtCase.class))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.PET))).thenReturn(Collections.emptyList());
        when(caseEnrichment.getWitnessDetails(any(CourtCase.class), eq(PartyType.RES))).thenReturn(Collections.emptyList());
        when(caseRepository.getExtraAdvocateDetails(anyString(), anyInt())).thenReturn(Collections.emptyList());
        when(advocateRepository.getAdvocateDetails(anyString())).thenReturn(null);

        extraPartiesProcessor.processExtraParties(courtCase);

        verify(producer).push(eq("save-extra-parties"), anyList());
        verify(producer, never()).push(eq("save-extra-advocate-details"), anyList());
    }
}
