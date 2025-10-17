package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.enrichment.CaseEnrichment;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service class for handling case-related operations
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CaseService {

    private final CaseRepository caseRepository;
    private final TransformerProperties properties;
    private final ObjectMapper objectMapper;
    private final CaseEnrichment caseEnrichment;

    /**
     * Processes and upserts (inserts or updates) a CourtCase in the NJDG format in the database
     * 
     * @param courtCase The CourtCase data to be processed and upserted
     * @param requestInfo The request info containing metadata about the request
     * @return The upserted NJDGTransformRecord
     * @throws IllegalArgumentException if the input is invalid
     */
    public NJDGTransformRecord processAndUpsertCase(CourtCase courtCase, RequestInfo requestInfo) {
        try {
            NJDGTransformRecord record = convertToNJDGRecord(courtCase);
            caseEnrichment.enrichPetitionerDetails(courtCase, record);
            caseEnrichment.enrichRespondentDetails(courtCase, record);
            caseEnrichment.enrichExtraParties(courtCase, record);
            caseEnrichment.enrichAdvocateDetails(courtCase, record);
            return record;
        } catch (CustomException exception) {
            log.error("Error processing CourtCase with CNR: {}. Error: {}", courtCase.getCnrNumber(), exception.getMessage());
            throw  new CustomException("Error process CourtCase::", exception.getMessage());
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
                .desgname(properties.getJudgeDesignation())
                .courtNo(1)//todo: configure for different courts
                .estCode(courtCase.getCourtId())
                .stateCode(32)//todo: need to configure for multiple state
                .distCode(getDistrictCode(courtCase))
                .build();
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

        // Extract police station code from case details
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
            Integer disposalType =  caseRepository.getDisposalStatus(outcome);
            if(disposalType != null) {
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
