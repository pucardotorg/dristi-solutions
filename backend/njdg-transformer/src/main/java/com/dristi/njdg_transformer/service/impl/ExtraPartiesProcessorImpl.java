package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.ExtraAdvocateDetails;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.cases.AdvocateMapping;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.service.interfaces.DataProcessor;
import com.dristi.njdg_transformer.enrichment.CaseEnrichment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

/**
 * Implementation for processing extra parties
 * Follows Single Responsibility Principle - only handles extra parties processing
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ExtraPartiesProcessorImpl implements DataProcessor {

    private final CaseRepository caseRepository;
    private final AdvocateRepository advocateRepository;
    private final Producer producer;
    private final CaseEnrichment caseEnrichment;

    @Override
    public void processExtraParties(CourtCase courtCase) {
        log.info("Processing extra parties for case CNR: {}", courtCase.getCnrNumber());
        
        try {
            // Fetch all extra parties
            List<PartyDetails> extraParties = getAllExtraParties(courtCase);
            log.debug("Found {} extra parties for case CNR: {}", 
                     extraParties.size(), courtCase.getCnrNumber());

            // Push extra parties to Kafka if present
            if (!extraParties.isEmpty()) {
                producer.push("save-extra-parties", extraParties);
                log.info("Pushed {} extra parties to Kafka for case CNR: {}", 
                        extraParties.size(), courtCase.getCnrNumber());
            }

            // Process and push extra advocates
            List<ExtraAdvocateDetails> extraAdvocates = buildExtraAdvocates(courtCase, extraParties);
            if (!extraAdvocates.isEmpty()) {
                producer.push("save-extra-advocate-details", extraAdvocates);
                log.info("Pushed {} extra advocates to Kafka for case CNR: {}", 
                        extraAdvocates.size(), courtCase.getCnrNumber());
            }

            log.info("Successfully processed extra parties for case CNR: {}", courtCase.getCnrNumber());

        } catch (Exception e) {
            log.error("Error processing extra parties for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to process extra parties", e);
        }
    }

    @Override
    public void processActs(CourtCase courtCase) {
        // This method is part of DataProcessor interface but not implemented in this class
        // Acts processing should be handled by a separate ActsProcessorImpl
        throw new UnsupportedOperationException("Acts processing not supported by ExtraPartiesProcessor");
    }

    private List<PartyDetails> getAllExtraParties(CourtCase courtCase) {
        log.debug("Fetching all extra parties for case CNR: {}", courtCase.getCnrNumber());

        // Get complainant extra parties
        List<PartyDetails> extraComplainants = caseEnrichment.getComplainantExtraParties(courtCase);
        List<PartyDetails> extraParties = new ArrayList<>(extraComplainants);
        log.debug("Added {} extra complainants for case CNR: {}", 
                 extraComplainants.size(), courtCase.getCnrNumber());

        // Get respondent extra parties
        List<PartyDetails> extraRespondents = caseEnrichment.getRespondentExtraParties(courtCase);
        extraParties.addAll(extraRespondents);
        log.debug("Added {} extra respondents for case CNR: {}", 
                 extraRespondents.size(), courtCase.getCnrNumber());

        // Get witness details
        List<PartyDetails> petWitnessDetails = caseEnrichment.getWitnessDetails(courtCase, PartyType.PET);
        extraParties.addAll(petWitnessDetails);
        log.debug("Added {} petitioner witnesses for case CNR: {}", 
                 petWitnessDetails.size(), courtCase.getCnrNumber());

        List<PartyDetails> resWitnessDetails = caseEnrichment.getWitnessDetails(courtCase, PartyType.RES);
        extraParties.addAll(resWitnessDetails);
        log.debug("Added {} respondent witnesses for case CNR: {}", 
                 resWitnessDetails.size(), courtCase.getCnrNumber());

        // Assign serial numbers
        for (int i = 0; i < extraParties.size(); i++) {
            extraParties.get(i).setSrNo(i + 1);
        }

        log.debug("Total extra parties found: {} for case CNR: {}", 
                 extraParties.size(), courtCase.getCnrNumber());
        return extraParties;
    }

    private List<ExtraAdvocateDetails> buildExtraAdvocates(CourtCase courtCase, List<PartyDetails> extraParties) {
        log.debug("Building extra advocates for {} parties in case CNR: {}", 
                 extraParties.size(), courtCase.getCnrNumber());
        
        List<ExtraAdvocateDetails> extraAdvocatesList = new ArrayList<>();

        for (PartyDetails party : extraParties) {
            try {
                processPartyAdvocates(courtCase, party, extraAdvocatesList);
            } catch (Exception e) {
                log.error("Error processing advocates for party {} in case CNR: {}: {}", 
                         party.getPartyId(), courtCase.getCnrNumber(), e.getMessage(), e);
                // Continue processing other parties
            }
        }

        log.debug("Built {} extra advocates for case CNR: {}", 
                 extraAdvocatesList.size(), courtCase.getCnrNumber());
        return extraAdvocatesList;
    }

    private void processPartyAdvocates(CourtCase courtCase, PartyDetails party, 
                                     List<ExtraAdvocateDetails> extraAdvocatesList) {
        String individualId = party.getPartyId();
        if (individualId == null) {
            log.debug("Skipping party with null individual ID");
            return;
        }

        String partyType = party.getPartyType() == PartyType.PET ? COMPLAINANT_PRIMARY : RESPONDENT_PRIMARY;
        log.debug("Processing advocates for party {} of type {} in case CNR: {}", 
                 individualId, partyType, courtCase.getCnrNumber());

        List<ExtraAdvocateDetails> existingAdvocates = getExistingAdvocates(courtCase, party, partyType);
        List<String> advocateIds = getAdvocateIdsForParty(courtCase, individualId);

        if (advocateIds.isEmpty()) {
            log.debug("No advocates found for party: {} in case CNR: {}", 
                     party.getPartyId(), courtCase.getCnrNumber());
            return;
        }

        int srNo = !existingAdvocates.isEmpty() ? 
                   existingAdvocates.get(existingAdvocates.size() - 1).getSrNo() + 1 : 1;

        for (String advocateId : advocateIds) {
            try {
                processAdvocate(courtCase, party, partyType, existingAdvocates, 
                              extraAdvocatesList, advocateId, srNo++);
            } catch (Exception e) {
                log.error("Error processing advocate {} for party {} in case CNR: {}: {}", 
                         advocateId, party.getPartyId(), courtCase.getCnrNumber(), e.getMessage(), e);
                // Continue processing other advocates
            }
        }
    }

    private List<ExtraAdvocateDetails> getExistingAdvocates(CourtCase courtCase, PartyDetails party, String partyType) {
        return caseRepository
                .getExtraAdvocateDetails(courtCase.getCnrNumber(), 
                                       COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType) ? 1 : 2)
                .stream()
                .filter(existingAdvocate -> Objects.equals(existingAdvocate.getPartyNo(), party.getSrNo()))
                .toList();
    }

    private List<String> getAdvocateIdsForParty(CourtCase courtCase, String individualId) {
        return courtCase.getRepresentatives().stream()
                .filter(mapping -> mapping.getRepresenting().stream()
                        .anyMatch(p -> individualId.equalsIgnoreCase(p.getIndividualId())))
                .map(AdvocateMapping::getAdvocateId)
                .toList();
    }

    private void processAdvocate(CourtCase courtCase, PartyDetails party, String partyType,
                               List<ExtraAdvocateDetails> existingAdvocates,
                               List<ExtraAdvocateDetails> extraAdvocatesList,
                               String advocateId, int srNo) {
        
        AdvocateDetails advocateDetails = advocateRepository.getAdvocateDetails(advocateId);
        if (advocateDetails == null) {
            log.warn("No advocate details found for advocate ID: {} in case CNR: {}", 
                    advocateId, courtCase.getCnrNumber());
            return;
        }

        if (advocateDetails.getAdvocateCode().equals(party.getAdvCd())) {
            log.debug("Skipping advocate {} as it matches party advocate code in case CNR: {}", 
                     advocateId, courtCase.getCnrNumber());
            return;
        }

        // Check if advocate already exists
        boolean advocateExists = updateExistingAdvocate(existingAdvocates, extraAdvocatesList, 
                                                       advocateDetails, party, partyType);

        if (!advocateExists) {
            createNewExtraAdvocate(courtCase, advocateDetails, party, partyType, 
                                 extraAdvocatesList, srNo);
        }
    }

    private boolean updateExistingAdvocate(List<ExtraAdvocateDetails> existingAdvocates,
                                         List<ExtraAdvocateDetails> extraAdvocatesList,
                                         AdvocateDetails advocateDetails, PartyDetails party, String partyType) {
        
        for (ExtraAdvocateDetails extraAdvocateDetails : existingAdvocates) {
            if (extraAdvocateDetails.getAdvCode().equals(advocateDetails.getAdvocateCode())) {
                extraAdvocateDetails.setPartyNo(party.getSrNo());
                extraAdvocateDetails.setType(COMPLAINANT_PRIMARY.equals(partyType) ? 1 : 2);
                extraAdvocateDetails.setAdvCode(advocateDetails.getAdvocateCode());
                extraAdvocateDetails.setAdvName(advocateDetails.getAdvocateName());
                extraAdvocateDetails.setPetResName(party.getPartyName());
                extraAdvocatesList.add(extraAdvocateDetails);
                
                log.debug("Updated existing advocate {} for party {} in case", 
                         advocateDetails.getAdvocateCode(), party.getPartyId());
                return true;
            }
        }
        return false;
    }

    private void createNewExtraAdvocate(CourtCase courtCase, AdvocateDetails advocateDetails, PartyDetails party,
                                      String partyType, List<ExtraAdvocateDetails> extraAdvocatesList, int srNo) {
        
        ExtraAdvocateDetails extraAdvocateDetails = ExtraAdvocateDetails.builder()
                .cino(courtCase.getCnrNumber())
                .advCode(advocateDetails.getAdvocateCode())
                .advName(advocateDetails.getAdvocateName())
                .type(COMPLAINANT_PRIMARY.equals(partyType) ? 1 : 2)
                .petResName(party.getPartyName())
                .partyNo(party.getSrNo())
                .srNo(srNo)
                .build();
        
        extraAdvocatesList.add(extraAdvocateDetails);
        log.debug("Created new extra advocate {} for party {} in case CNR: {}", 
                 advocateDetails.getAdvocateCode(), party.getPartyId(), courtCase.getCnrNumber());
    }
}
