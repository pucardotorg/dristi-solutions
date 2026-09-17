package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.model.Act;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.cases.StatuteSection;
import com.dristi.njdg_transformer.producer.Producer;
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
class ActsProcessorImplTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private Producer producer;

    @InjectMocks
    private ActsProcessorImpl actsProcessor;

    private CourtCase courtCase;
    private Act actMaster;

    @BeforeEach
    void setUp() {
        courtCase = new CourtCase();
        courtCase.setCnrNumber("CNR-001");
        courtCase.setStatutesAndSections(new ArrayList<>());

        actMaster = Act.builder()
                .actCode(1)
                .actName("Negotiable Instruments Act")
                .build();
    }

    @Test
    void testProcessActs_Success() {
        when(caseRepository.getActs(anyString())).thenReturn(Collections.emptyList());
        when(caseRepository.getActMaster(anyString())).thenReturn(actMaster);

        actsProcessor.processActs(courtCase);

        verify(producer).push(eq("save-act-details"), any(Act.class));
    }

    @Test
    void testProcessActs_ExistingActs() {
        Act existingAct = Act.builder()
                .srNo(1)
                .cino("CNR-001")
                .actCode(1)
                .build();

        when(caseRepository.getActs(anyString())).thenReturn(Collections.singletonList(existingAct));

        actsProcessor.processActs(courtCase);

        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testProcessActs_NoActMaster() {
        when(caseRepository.getActs(anyString())).thenReturn(Collections.emptyList());
        when(caseRepository.getActMaster(anyString())).thenReturn(null);

        actsProcessor.processActs(courtCase);

        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testProcessActs_WithStatuteSection() {
        StatuteSection statuteSection = new StatuteSection();
        statuteSection.setSubsections(Collections.singletonList("138"));
        courtCase.setStatutesAndSections(Collections.singletonList(statuteSection));

        when(caseRepository.getActs(anyString())).thenReturn(Collections.emptyList());
        when(caseRepository.getActMaster(anyString())).thenReturn(actMaster);

        actsProcessor.processActs(courtCase);

        verify(producer).push(eq("save-act-details"), argThat(act -> {
            Act createdAct = (Act) act;
            return "138".equals(createdAct.getActSection());
        }));
    }

    @Test
    void testProcessActs_Exception() {
        when(caseRepository.getActs(anyString())).thenThrow(new RuntimeException("Database error"));

        assertThrows(RuntimeException.class, () -> actsProcessor.processActs(courtCase));
    }

    @Test
    void testProcessExtraParties_ThrowsUnsupportedOperationException() {
        assertThrows(UnsupportedOperationException.class, () -> actsProcessor.processExtraParties(courtCase));
    }

    @Test
    void testProcessActs_DefaultSection() {
        courtCase.setStatutesAndSections(null);

        when(caseRepository.getActs(anyString())).thenReturn(Collections.emptyList());
        when(caseRepository.getActMaster(anyString())).thenReturn(actMaster);

        actsProcessor.processActs(courtCase);

        verify(producer).push(eq("save-act-details"), argThat(act -> {
            Act createdAct = (Act) act;
            return "138".equals(createdAct.getActSection());
        }));
    }

    @Test
    void testProcessActs_EmptySubsections() {
        StatuteSection statuteSection = new StatuteSection();
        statuteSection.setSubsections(Collections.emptyList());
        courtCase.setStatutesAndSections(Collections.singletonList(statuteSection));

        when(caseRepository.getActs(anyString())).thenReturn(Collections.emptyList());
        when(caseRepository.getActMaster(anyString())).thenReturn(actMaster);

        actsProcessor.processActs(courtCase);

        verify(producer).push(eq("save-act-details"), argThat(act -> {
            Act createdAct = (Act) act;
            return "138".equals(createdAct.getActSection());
        }));
    }

    @Test
    void testProcessActs_CorrectActDetails() {
        when(caseRepository.getActs(anyString())).thenReturn(Collections.emptyList());
        when(caseRepository.getActMaster(anyString())).thenReturn(actMaster);

        actsProcessor.processActs(courtCase);

        verify(producer).push(eq("save-act-details"), argThat(act -> {
            Act createdAct = (Act) act;
            return createdAct.getCino().equals("CNR-001") &&
                   createdAct.getActCode().equals(1) &&
                   createdAct.getActName().equals("Negotiable Instruments Act") &&
                   createdAct.getSrNo() == 1;
        }));
    }
}
