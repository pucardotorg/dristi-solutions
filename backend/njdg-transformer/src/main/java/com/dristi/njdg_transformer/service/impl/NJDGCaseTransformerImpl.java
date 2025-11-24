package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderCriteria;
import com.dristi.njdg_transformer.model.order.OrderListResponse;
import com.dristi.njdg_transformer.model.order.OrderSearchRequest;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.interfaces.CaseTransformer;
import com.dristi.njdg_transformer.utils.DateUtil;
import com.dristi.njdg_transformer.utils.NumberExtractor;
import com.dristi.njdg_transformer.utils.OrderUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.jetbrains.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
    private final Producer producer;
    private final OrderUtil orderUtil;

    @Override
    public NJDGTransformRecord transform(CourtCase courtCase, RequestInfo requestInfo) {
        log.info("Starting NJDG transformation for case CNR: {}", courtCase.getCnrNumber());
        
        try {
            // Use registrationDate for case transformation
            LocalDate searchDate = convertToLocalDate(courtCase.getRegistrationDate());
            List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
            JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
            DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);
            
            NJDGTransformRecord record = buildNJDGRecord(courtCase, judgeDetails, designationMaster, requestInfo);
            enrichPoliceStationDetails(courtCase, record);
            log.info("Successfully transformed case CNR: {} to NJDG format", courtCase.getCnrNumber());
            producer.push("save-case-details", record);
            return record;
            
        } catch (Exception e) {
            log.error("Error transforming case CNR: {} to NJDG format: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to transform case to NJDG format", e);
        }
    }

    private NJDGTransformRecord buildNJDGRecord(CourtCase courtCase, JudgeDetails judgeDetails, 
                                               DesignationMaster designationMaster, RequestInfo requestInfo) {
        log.info("Building NJDG record for case: {}", courtCase.getCnrNumber());
        
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
                .dateOfDecision(getDateOfDecision(courtCase, requestInfo))
                .dispReason(courtCase.getOutcome() != null ? 
                           getDisposalReasonAsInteger(courtCase.getOutcome()) : 0)
                .dispNature(0) // TODO: Configure for contested/uncontested when provided
                .desgname(designationMaster.getDesgName())
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : (properties.getCourtNumber() != null ? properties.getCourtNumber() : 0))
                .estCode(courtCase.getCourtId())
                .stateCode(properties.getStateCode())
                .distCode(getDistrictCode(courtCase))
                .purposeCode(getPurposeCode(courtCase))
                .jocode(judgeDetails != null ? judgeDetails.getJocode() : null)
                .cicriType(properties.getCicriType() != null ? properties.getCicriType() : 0)
                .dateFirstList(setDateFirstList(courtCase.getCnrNumber()))
                .dateNextList(setNextListDate(courtCase.getCnrNumber()))
                .dateLastList(setNextListDate(courtCase.getCnrNumber()))
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode() : null)
                .desigCode(designationMaster.getDesgCode())
                .build();
    }

    @Nullable
    private LocalDate getDateOfDecision(CourtCase courtCase, RequestInfo requestInfo) {
        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(OrderCriteria.builder().filingNumber(courtCase.getFilingNumber()).status(PUBLISHED_ORDER).build())
                .build();
        OrderListResponse orderListResponse = orderUtil.getOrders(orderSearchRequest);
        if(orderListResponse == null || orderListResponse.getList()==null || orderListResponse.getList().isEmpty()){
            log.info("Case hasn't disposed yet for cino: {}", courtCase.getCnrNumber());
            return null;
        }
        for(Order order : orderListResponse.getList()){
            if(INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory()) && JUDGEMENT.equalsIgnoreCase(order.getOrderType())) {
                return dateUtil.formatDate(order.getCreatedDate());
            } else if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
                JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
                for(JsonNode compositeItem : compositeItems){
                    if(JUDGEMENT.equalsIgnoreCase(compositeItem.get("orderType").asText())) {
                        return dateUtil.formatDate(order.getCreatedDate());
                    }
                }
            }
        }
        return courtCase.getJudgementDate() != null ?
                dateUtil.formatDate(courtCase.getJudgementDate()) : null;
    }

    private Integer getCaseTypeValue(String caseType) {
        if (caseType == null || caseType.trim().isEmpty()) {
            log.warn("Case type is null or empty");
            return null;
        }
        
        Integer caseTypeCode = caseRepository.getCaseTypeCode(caseType);
        log.info("Retrieved case type code: {} for case type: {}", caseTypeCode, caseType);
        return caseTypeCode;
    }

    private Character getDisposalStatus(String outcome) {
        if (outcome == null) {
            log.info("Outcome is null, returning pending status");
            return 'P';
        }
        
        Integer disposalTypeCode = caseRepository.getDisposalStatus(outcome);
        if (disposalTypeCode != null) {
            log.info("Case has disposal status for outcome: {}", outcome);
            return 'D';
        } else {
            log.info("Case is pending for outcome: {}", outcome);
            return 'P';
        }
    }

    private String getDisposalReason(String outcome) {
        Integer disposalType = caseRepository.getDisposalStatus(outcome);
        if (disposalType != null) {
            log.info("Retrieved disposal reason: {} for outcome: {}", disposalType, outcome);
            return disposalType.toString();
        }
        log.info("No disposal reason found for outcome: {}", outcome);
        return null;
    }

    private Integer getDisposalReasonAsInteger(String outcome) {
        Integer disposalType = caseRepository.getDisposalStatus(outcome);
        if (disposalType != null) {
            log.info("Retrieved disposal reason: {} for outcome: {}", disposalType, outcome);
            return disposalType;
        }
        log.info("No disposal reason found for outcome: {}", outcome);
        return 0;
    }

    private Integer getDistrictCode(CourtCase courtCase) {
        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null || caseDetails.path("chequeDetails").isMissingNode()) {
                log.info("No cheque details found in case additional details for CNR: {}", 
                         courtCase.getCnrNumber());
                return null;
            }

            JsonNode chequeDetails = caseDetails.path("chequeDetails");
            if (chequeDetails.path("formdata").isMissingNode() || 
                !chequeDetails.path("formdata").isArray() || 
                chequeDetails.path("formdata").isEmpty()) {
                log.info("No formdata found in cheque details for CNR: {}", courtCase.getCnrNumber());
                return null;
            }

            JsonNode policeStationNode = chequeDetails.path("formdata").get(0)
                    .path("data")
                    .path("policeStationJurisDictionCheque");

            if (policeStationNode.isMissingNode()) {
                log.info("No police station details found in cheque details for CNR: {}", 
                         courtCase.getCnrNumber());
                return null;
            }

            String districtName = policeStationNode.path("district").asText();
            Integer districtCode = caseRepository.getDistrictCode(districtName);
            log.info("Retrieved district code: {} for district: {} in case CNR: {}", 
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
                log.info("Retrieved purpose code: {} for case CNR: {}", purposeCode, courtCase.getCnrNumber());
            } else {
                log.info("No hearing details found for case CNR: {}, using default purpose code: {}", 
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
            // Note: This method needs a date parameter, but we don't have context for the date here
            // Using current date as fallback - this may need to be revised based on business requirements
            LocalDate searchDate = LocalDate.now();
            List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
            JudgeDetails judgeDetails = judgeDetailsList.stream()
                .filter(judge -> judgeId.equals(judge.getJudgeCode().toString()))
                .findFirst()
                .orElse(null);
            if (judgeDetails != null) {
                log.info("Retrieved JO code: {} for judge ID: {}", judgeDetails.getJocode(), judgeId);
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
                log.info("Retrieved first hearing date: {} for case CNR: {}", dateFirstList, cnrNumber);
            } else {
                log.info("No hearing details found for case CNR: {}", cnrNumber);
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
                log.info("Retrieved last hearing date: {} for case CNR: {}", dateLastList, cnrNumber);
            } else {
                log.info("No hearing details found for case CNR: {}", cnrNumber);
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
        log.info("Enriching police station details for case CNR: {}", courtCase.getCnrNumber());

        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null) {
                log.info("No case details found for police station enrichment in case CNR: {}",
                        courtCase.getCnrNumber());
                return;
            }

            JsonNode policeStationNode = caseDetails.path("chequeDetails")
                    .path("formdata").get(0)
                    .path("data")
                    .path("policeStationJurisDictionCheque");

            if (policeStationNode.isMissingNode()) {
                log.info("No police station node found in case details for CNR: {}",
                        courtCase.getCnrNumber());
                return;
            }

            String policeStationCode = policeStationNode.path("code").asText();
            if (policeStationCode == null || policeStationCode.isEmpty()) {
                log.info("No police station code found for case CNR: {}", courtCase.getCnrNumber());
                return;
            }

            PoliceStationDetails policeDetails = caseRepository.getPoliceStationDetails(policeStationCode);
            if (policeDetails != null) {
                record.setPoliceStCode(policeDetails.getPoliceStationCode());
                record.setPoliceNcode(policeDetails.getNatCode());
                record.setPoliceStation(policeDetails.getStName());
                log.info("Successfully enriched police station details for case CNR: {}",
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
    
    private LocalDate convertToLocalDate(Long timestamp) {
        if (timestamp == null) {
            return LocalDate.now(); // fallback to current date
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }
}
