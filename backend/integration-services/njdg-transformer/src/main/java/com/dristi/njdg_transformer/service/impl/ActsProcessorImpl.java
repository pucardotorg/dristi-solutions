package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.model.Act;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.service.interfaces.DataProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

import static com.dristi.njdg_transformer.config.ServiceConstants.ACT_NAME;

/**
 * Implementation for processing acts
 * Follows Single Responsibility Principle - only handles acts processing
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ActsProcessorImpl implements DataProcessor {

    private final CaseRepository caseRepository;
    private final Producer producer;

    @Override
    public void processExtraParties(CourtCase courtCase) {
        // This method is part of DataProcessor interface but not implemented in this class
        // Extra parties processing should be handled by ExtraPartiesProcessorImpl
        throw new UnsupportedOperationException("Extra parties processing not supported by ActsProcessor");
    }

    @Override
    public void processActs(CourtCase courtCase) {
        log.info("Processing acts for case CNR: {}", courtCase.getCnrNumber());
        
        try {
            // TODO: Currently configured for single act, need to configure for multiple acts
            List<Act> existingActs = caseRepository.getActs(courtCase.getCnrNumber());
            if(!existingActs.isEmpty()){
                log.info("Found {} existing acts for case CNR: {}",
                        existingActs.size(), courtCase.getCnrNumber());
                return;
            }
            
            int srNo = calculateNextSerialNumber(existingActs);
            Act actMaster = caseRepository.getActMaster(ACT_NAME);
            
            if (actMaster == null) {
                log.warn("No act master found for act name: {} in case CNR: {}", 
                        ACT_NAME, courtCase.getCnrNumber());
                return;
            }

            Act newAct = buildNewAct(courtCase, actMaster, srNo);
            producer.push("save-act-details", newAct);
            
            log.info("Successfully processed and pushed act for case CNR: {}", courtCase.getCnrNumber());
            
        } catch (Exception e) {
            log.error("Error processing acts for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to process acts", e);
        }
    }

    private int calculateNextSerialNumber(List<Act> existingActs) {
        if (existingActs.isEmpty()) {
            log.info("No existing acts found, starting with serial number 1");
            return 1;
        }

        int maxSrNo = existingActs.stream()
                .map(Act::getSrNo)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        int nextSrNo = maxSrNo + 1;

        log.info("Calculated next serial number: {} (max existing srNo: {})", nextSrNo, maxSrNo);
        return nextSrNo;
    }

    private Act buildNewAct(CourtCase courtCase, Act actMaster, int srNo) {
        log.info("Building new act with serial number {} for case CNR: {}",
                 srNo, courtCase.getCnrNumber());
        
        String actSection = extractActSection(courtCase);
        
        Act newAct = Act.builder()
                .srNo(srNo)
                .cino(courtCase.getCnrNumber())
                .actCode(actMaster.getActCode())
                .actName(actMaster.getActName())
                .actSection(actSection != null ? actSection : "138")
                .build();
        
        log.info("Built new act: code={}, name={}, section={} for case CNR: {}",
                 newAct.getActCode(), newAct.getActName(), newAct.getActSection(), 
                 courtCase.getCnrNumber());
        
        return newAct;
    }

    private String extractActSection(CourtCase courtCase) {
        try {
            if (courtCase.getStatutesAndSections() != null && 
                !courtCase.getStatutesAndSections().isEmpty() &&
                courtCase.getStatutesAndSections().get(0).getSubsections() != null &&
                !courtCase.getStatutesAndSections().get(0).getSubsections().isEmpty()) {
                
                String actSection = courtCase.getStatutesAndSections().get(0).getSubsections().get(0);
                log.info("Extracted act section: {} for case CNR: {}", actSection, courtCase.getCnrNumber());
                return actSection;
            }
            
            log.info("No act section found for case CNR: {}", courtCase.getCnrNumber());
            return null;
            
        } catch (Exception e) {
            log.error("Error extracting act section for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            return null;
        }
    }
}
