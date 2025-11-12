package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.interfaces.CaseTransformer;
import com.dristi.njdg_transformer.utils.DateUtil;
import com.dristi.njdg_transformer.utils.NumberExtractor;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

/**
 * Implementation of CaseTransformer for NJDG format
 * Follows Single Responsibility Principle - only handles case transformation
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NJDGCaseTransformerImpl implements CaseTransformer {

    private final CaseRepository caseRepository;
    private final TransformerProperties properties;
    private final ObjectMapper objectMapper;
    private final HearingRepository hearingRepository;
    private final DateUtil dateUtil;
    private final NumberExtractor numberExtractor;

    @Override
    public NJDGTransformRecord transform(CourtCase courtCase, RequestInfo requestInfo) {
        log.info("Starting NJDG transformation for case CNR: {}", courtCase.getCnrNumber());
        
        try {
            JudgeDetails judgeDetails = caseRepository.getJudge(courtCase.getJudgeId());
            DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);
            
            NJDGTransformRecord record = buildNJDGRecord(courtCase, judgeDetails, designationMaster);
            enrichPoliceStationDetails(courtCase, record);
            log.info("Successfully transformed case CNR: {} to NJDG format", courtCase.getCnrNumber());
            return record;
            
        } catch (Exception e) {
            log.error("Error transforming case CNR: {} to NJDG format: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to transform case to NJDG format", e);
        }
    }

    private NJDGTransformRecord buildNJDGRecord(CourtCase courtCase, JudgeDetails judgeDetails, 
                                               DesignationMaster designationMaster) {
        log.debug("Building NJDG record for case: {}", courtCase.getCnrNumber());
        
        return NJDGTransformRecord.builder()
                .cino(courtCase.getCnrNumber())
                .dateOfFiling(dateUtil.formatDate(courtCase.getFilingDate()))
                .dtRegis(dateUtil.formatDate(courtCase.getRegistrationDate()))
                .caseType(getCaseTypeValue(courtCase.getCaseType()))
                .filNo(numberExtractor.extractFilingNumber(courtCase.getFilingNumber()))
                .filYear(dateUtil.extractYear(courtCase.getFilingDate()))
                .regNo(numberExtractor.extractCaseNumber(
                    courtCase.getCourtCaseNumber() != null ? 
                    courtCase.getCourtCaseNumber() : courtCase.getCmpNumber()))
                .regYear(dateUtil.extractYear(courtCase.getRegistrationDate()))
                .pendDisp(getDisposalStatus(courtCase.getOutcome()))
                .dateOfDecision(courtCase.getJudgementDate() != null ? 
                               dateUtil.formatDate(courtCase.getJudgementDate()) : null)
                .dispReason(courtCase.getOutcome() != null ? 
                           getDisposalReason(courtCase.getOutcome()) : "")
                .dispNature(null) // TODO: Configure for contested/uncontested when provided
                .desgname(caseRepository.getJudgeDesignation(JUDGE_DESIGNATION))
                .courtNo(properties.getCourtNumber())
                .estCode(courtCase.getCourtId())
                .stateCode(properties.getStateCode())
                .distCode(getDistrictCode(courtCase))
                .purposeCode(getPurposeCode(courtCase))
                .jocode(getJoCodeForJudge(courtCase.getJudgeId()))
                .cicriType(properties.getCicriType())
                .dateFirstList(setDateFirstList(courtCase.getCnrNumber()))
                .dateNextList(setNextListDate(courtCase.getCnrNumber()))
                .dateLastList(setNextListDate(courtCase.getCnrNumber()))
                .judgeCode(judgeDetails.getJudgeCode())
                .desigCode(designationMaster.getDesgCode())
                .build();
    }

    private Integer getCaseTypeValue(String caseType) {
        if (caseType == null || caseType.trim().isEmpty()) {
            log.warn("Case type is null or empty");
            return null;
        }
        
        Integer caseTypeCode = caseRepository.getCaseTypeCode(caseType);
        log.debug("Retrieved case type code: {} for case type: {}", caseTypeCode, caseType);
        return caseTypeCode;
    }

    private Character getDisposalStatus(String outcome) {
        if (outcome == null) {
            log.debug("Outcome is null, returning pending status");
            return 'P';
        }
        
        Integer disposalTypeCode = caseRepository.getDisposalStatus(outcome);
        if (disposalTypeCode != null) {
            log.debug("Case has disposal status for outcome: {}", outcome);
            return 'D';
        } else {
            log.debug("Case is pending for outcome: {}", outcome);
            return 'P';
        }
    }

    private String getDisposalReason(String outcome) {
        Integer disposalType = caseRepository.getDisposalStatus(outcome);
        if (disposalType != null) {
            log.debug("Retrieved disposal reason: {} for outcome: {}", disposalType, outcome);
            return disposalType.toString();
        }
        log.debug("No disposal reason found for outcome: {}", outcome);
        return null;
    }

    private Integer getDistrictCode(CourtCase courtCase) {
        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null || caseDetails.path("chequeDetails").isMissingNode()) {
                log.debug("No cheque details found in case additional details for CNR: {}", 
                         courtCase.getCnrNumber());
                return null;
            }

            JsonNode chequeDetails = caseDetails.path("chequeDetails");
            if (chequeDetails.path("formdata").isMissingNode() || 
                !chequeDetails.path("formdata").isArray() || 
                chequeDetails.path("formdata").isEmpty()) {
                log.debug("No formdata found in cheque details for CNR: {}", courtCase.getCnrNumber());
                return null;
            }

            JsonNode policeStationNode = chequeDetails.path("formdata").get(0)
                    .path("data")
                    .path("policeStationJurisDictionCheque");

            if (policeStationNode.isMissingNode()) {
                log.debug("No police station details found in cheque details for CNR: {}", 
                         courtCase.getCnrNumber());
                return null;
            }

            String districtName = policeStationNode.path("district").asText();
            Integer districtCode = caseRepository.getDistrictCode(districtName);
            log.debug("Retrieved district code: {} for district: {} in case CNR: {}", 
                     districtCode, districtName, courtCase.getCnrNumber());
            return districtCode;
            
        } catch (Exception e) {
            log.error("Error extracting district code for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            return null;
        }
    }

    private Integer getPurposeCode(CourtCase courtCase) {
        try {
            List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(courtCase.getCnrNumber());
            int purposeCode = 0; // Default as it has not null constraint
            
            if (hearingDetails != null && !hearingDetails.isEmpty()) {
                int n = hearingDetails.size();
                purposeCode = Integer.parseInt(hearingDetails.get(n - 1).getPurposeOfListing());
                log.debug("Retrieved purpose code: {} for case CNR: {}", purposeCode, courtCase.getCnrNumber());
            } else {
                log.debug("No hearing details found for case CNR: {}, using default purpose code: {}", 
                         courtCase.getCnrNumber(), purposeCode);
            }
            
            return purposeCode;
            
        } catch (Exception e) {
            log.error("Error retrieving purpose code for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            return 0;
        }
    }

    private String getJoCodeForJudge(String judgeId) {
        try {
            JudgeDetails judgeDetails = caseRepository.getJudge(judgeId);
            if (judgeDetails != null) {
                log.debug("Retrieved JO code: {} for judge ID: {}", judgeDetails.getJocode(), judgeId);
                return judgeDetails.getJocode();
            }
            log.warn("No judge details found for judge ID: {}", judgeId);
            return "";
            
        } catch (Exception e) {
            log.error("Error retrieving JO code for judge ID: {}: {}", judgeId, e.getMessage(), e);
            return "";
        }
    }

    private LocalDate setDateFirstList(String cnrNumber) {
        try {
            List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cnrNumber);
            LocalDate dateFirstList = null;
            
            if (hearingDetails != null && !hearingDetails.isEmpty()) {
                dateFirstList = hearingDetails.get(0).getHearingDate();
                log.debug("Retrieved first hearing date: {} for case CNR: {}", dateFirstList, cnrNumber);
            } else {
                log.debug("No hearing details found for case CNR: {}", cnrNumber);
            }
            
            return dateFirstList;
            
        } catch (Exception e) {
            log.error("Error retrieving first hearing date for case CNR: {}: {}", 
                     cnrNumber, e.getMessage(), e);
            return null;
        }
    }

    private LocalDate setNextListDate(String cnrNumber) {
        try {
            List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cnrNumber);
            LocalDate dateLastList = null;
            
            if (hearingDetails != null && !hearingDetails.isEmpty()) {
                dateLastList = hearingDetails.get(hearingDetails.size() - 1).getHearingDate();
                log.debug("Retrieved last hearing date: {} for case CNR: {}", dateLastList, cnrNumber);
            } else {
                log.debug("No hearing details found for case CNR: {}", cnrNumber);
            }
            
            return dateLastList;
            
        } catch (Exception e) {
            log.error("Error retrieving last hearing date for case CNR: {}: {}", 
                     cnrNumber, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Enrich police station details in NJDG record
     */
    public void enrichPoliceStationDetails(CourtCase courtCase, NJDGTransformRecord record) {
        log.debug("Enriching police station details for case CNR: {}", courtCase.getCnrNumber());

        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null) {
                log.debug("No case details found for police station enrichment in case CNR: {}",
                        courtCase.getCnrNumber());
                return;
            }

            JsonNode policeStationNode = caseDetails.path("chequeDetails")
                    .path("formdata").get(0)
                    .path("data")
                    .path("policeStationJurisDictionCheque");

            if (policeStationNode.isMissingNode()) {
                log.debug("No police station node found in case details for CNR: {}",
                        courtCase.getCnrNumber());
                return;
            }

            String policeStationCode = policeStationNode.path("code").asText();
            if (policeStationCode == null || policeStationCode.isEmpty()) {
                log.debug("No police station code found for case CNR: {}", courtCase.getCnrNumber());
                return;
            }

            PoliceStationDetails policeDetails = caseRepository.getPoliceStationDetails(policeStationCode);
            if (policeDetails != null) {
                record.setPoliceStCode(policeDetails.getPoliceStationCode());
                record.setPoliceNcode(policeDetails.getNatCode());
                record.setPoliceStation(policeDetails.getStName());
                log.debug("Successfully enriched police station details for case CNR: {}",
                        courtCase.getCnrNumber());
            } else {
                log.warn("No police station details found for code: {} in case CNR: {}",
                        policeStationCode, courtCase.getCnrNumber());
            }

        } catch (Exception e) {
            log.error("Error enriching police station details for case CNR: {}: {}",
                    courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to enrich police station details", e);
        }
    }
}
