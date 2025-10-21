package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.enrichment.CaseEnrichment;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.cases.StatuteSection;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.dristi.njdg_transformer.config.ServiceConstants.COMPLAINANT_PRIMARY;
import static com.dristi.njdg_transformer.config.ServiceConstants.RESPONDENT_PRIMARY;

/**
 * Service class for handling case-related operations
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CaseService {

    private final CaseRepository caseRepository;
    private final TransformerProperties properties;
    private final ObjectMapper objectMapper;
    private final CaseEnrichment caseEnrichment;
    private final Producer producer;

    /**
     * Processes and upserts (inserts or updates) a CourtCase in the NJDG format in the database
     * 
     * @param courtCase The CourtCase data to be processed and upserted
     * @return The upserted NJDGTransformRecord
     * @throws IllegalArgumentException if the input is invalid
     */
    public NJDGTransformRecord processAndUpsertCase(CourtCase courtCase) {
        try {
            NJDGTransformRecord record = convertToNJDGRecord(courtCase);
            caseEnrichment.enrichPrimaryPartyDetails(courtCase, record, COMPLAINANT_PRIMARY);
            caseEnrichment.enrichPrimaryPartyDetails(courtCase, record, RESPONDENT_PRIMARY);
            caseEnrichment.enrichAdvocateDetails(courtCase, record, COMPLAINANT_PRIMARY);
            caseEnrichment.enrichAdvocateDetails(courtCase, record, RESPONDENT_PRIMARY);
            caseEnrichment.enrichPoliceStationDetails(courtCase, record);

            processAndUpdateExtraParties(courtCase);
            processAndUpdateActs(courtCase);
            producer.push("save-case-details", record);
            return record;
        } catch (CustomException exception) {
            log.error("Error processing CourtCase with CNR: {}. Error: {}", courtCase.getCnrNumber(), exception.getMessage());
            throw  new CustomException("Error process CourtCase::", exception.getMessage());
        }
    }

    private void processAndUpdateActs(CourtCase courtCase) {
        List<StatuteSection> statuteSections = courtCase.getStatutesAndSections();

        if(statuteSections == null || statuteSections.isEmpty()){
            log.info("No Statutes present for case with cino:: {}", courtCase.getCnrNumber());
            return;
        }
        for(StatuteSection statuteSection : statuteSections) {
            //todo: update act details for the case
        }
    }

    private void processAndUpdateExtraParties(CourtCase courtCase) {
        List<PartyDetails> extraParties = new ArrayList<>();

        // Fetch extra complainants (non-primary)
        List<PartyDetails> extraComplainants = caseEnrichment.enrichExtraPartyDetails(courtCase, COMPLAINANT_PRIMARY);
        if (extraComplainants != null && !extraComplainants.isEmpty()) {
            extraParties.addAll(extraComplainants);
            log.debug("Added {} extra complainant parties", extraComplainants.size());
        }

        // Fetch extra respondents (non-primary)
        List<PartyDetails> extraRespondents = caseEnrichment.enrichExtraPartyDetails(courtCase, RESPONDENT_PRIMARY);
        if (extraRespondents != null && !extraRespondents.isEmpty()) {
            extraParties.addAll(extraRespondents);
            log.debug("Added {} extra respondent parties", extraRespondents.size());
        }

        // Handle or persist the combined list
        if (!extraParties.isEmpty()) {
            producer.push("save-extra-parties", extraParties);
            log.info("Processed total {} extra parties for case {}", extraParties.size(), courtCase.getCnrNumber());
        } else {
            log.info("No extra parties found for case {}", courtCase.getCnrNumber());
        }
    }


    private NJDGTransformRecord convertToNJDGRecord(CourtCase courtCase) {
        return NJDGTransformRecord.builder()
                .cino(courtCase.getCnrNumber())
                .dateOfFiling(formatDate(courtCase.getFilingDate()))
                .dtRegis(formatDate(courtCase.getRegistrationDate()))
                .caseType(getCaseTypeValue(courtCase.getCaseType()))
                .filNo(extractFilingNumber(courtCase.getFilingNumber()))
                .filYear(extractYear(courtCase.getFilingDate()))
                .regNo(extractCaseNumber(courtCase.getCourtCaseNumber()))
                .regYear(extractYear(courtCase.getRegistrationDate()))
                .pendDisp(getDisposalStatus(courtCase.getOutcome()))
                .dateOfDecision(formatDate(courtCase.getJudgementDate()))
                .dispReason(getDisposalReason(courtCase.getOutcome()))
                .dispNature('1')//todo: configure on contested(1) and uncontested(2)
                .desgname(properties.getJudgeDesignation())//todo: configure to get from desg_type table
                .courtNo(1)//todo: configure for different courts
                .estCode(courtCase.getCourtId())
                .stateCode(32)//todo: configure value in properties
                .distCode(getDistrictCode(courtCase))
                .purposeCode(0)//todo: need to extract from hearings:: extract code for latest hearing
                .jocode(getJoCodeForJudge(courtCase.getJudgeId()))
                .cicriType('3') //todo: configure in properties
                .build();
    }

    private String getJoCodeForJudge(String judgeId) {
        JudgeDetails judgeDetails = caseRepository.getJudge(judgeId);
        if(judgeDetails != null) {
            return judgeDetails.getJocode();
        }
        return "";
    }

    private Integer getDistrictCode(CourtCase courtCase) {
        JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
        if (caseDetails == null || caseDetails.path("chequeDetails").isMissingNode()) {
            log.debug("No cheque details found in case additional details");
        }

        JsonNode chequeDetails = caseDetails.path("chequeDetails");
        if (chequeDetails.path("formdata").isMissingNode() || !chequeDetails.path("formdata").isArray() || chequeDetails.path("formdata").isEmpty()) {
            log.debug("No formdata found in cheque details");
        }

        JsonNode policeStationNode = chequeDetails.path("formdata").get(0)
                .path("data")
                .path("policeStationJurisDictionCheque");

        if (policeStationNode.isMissingNode()) {
            log.debug("No police station details found in cheque details");
        }

        String districtName = policeStationNode.path("district").asText();
        return caseRepository.getDistrictCode(districtName);
    }

    private String getDisposalReason(String outcome) {
        Integer disposalType =  caseRepository.getDisposalStatus(outcome);
        if(disposalType != null) {
            return disposalType.toString();
        }
        return null;
    }

    private Character getDisposalStatus(String outcome) {
        if(outcome == null) {
            return 'P';
        } else {
            Integer disposalTypeCode =  caseRepository.getDisposalStatus(outcome);
            if(disposalTypeCode != null) {
                return 'D';
            } else {
                return 'P';
            }
        }
    }

    private Integer getCaseTypeValue(String caseType) {
        if (caseType == null || caseType.trim().isEmpty()) {
            return null;
        }
        return caseRepository.getCaseTypeCode(caseType);
    }

    private Integer extractFilingNumber(String filingNumber) {
        if (filingNumber == null || filingNumber.isEmpty()) {
            return null;
        }
        String[] parts = filingNumber.split("-");
        String numberPart = parts[1].replaceFirst("^0+(?!$)", "");
        try {
            return Integer.valueOf(numberPart);
        } catch (NumberFormatException e) {
            log.error("Error while extracting filing number for case filing number:: {}, message:: {}", filingNumber, e.getMessage());
            return null;
        }
    }


    private Integer extractYear(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Integer.valueOf(Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .format(DateTimeFormatter.ofPattern("yyyy")));
    }

    private Integer extractCaseNumber(String caseNumber) {
        if (caseNumber == null || caseNumber.trim().isEmpty()) {
            return null;
        }
        Pattern pattern = java.util.regex.Pattern.compile(".*/(\\d+)/.*");
        Matcher matcher = pattern.matcher(caseNumber);
        if (matcher.matches()) {
            try {
                String numberPart = matcher.group(1).replaceFirst("^0+(?!$)", ""); // remove leading zeros
                return Integer.valueOf(numberPart);
            } catch (NumberFormatException e) {
                log.error("Error processing case number ::{}, message::{}", caseNumber, e.getMessage());
                return null;
            }
        }
        return null;
    }

    private LocalDate formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }
}
