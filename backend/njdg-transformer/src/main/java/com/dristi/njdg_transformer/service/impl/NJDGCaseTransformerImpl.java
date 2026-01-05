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
import com.dristi.njdg_transformer.utils.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.jetbrains.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

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
    private final MdmsUtil mdmsUtil;
    private final JsonUtil jsonUtil;

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
            if(caseRepository.findByCino(record.getCino()) == null){
                caseRepository.insertRecord(record);
            }

            return record;
            
        } catch (Exception e) {
            log.error("Error transforming case CNR: {} to NJDG format: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to transform case to NJDG format", e);
        }
    }

    private CaseTypeDetails getCaseTypeDetails(CourtCase courtCase, NJDGTransformRecord record) {
        String caseType = courtCase.getCaseType();
        Integer caseTypeValue = record.getCaseType();

        CaseTypeDetails.CaseTypeDetailsBuilder builder = CaseTypeDetails.builder();

        if (CMP.equalsIgnoreCase(caseType)) {
            // For CMP cases: assign only old values using courtCaseNumber or cmpNumber
            String caseNumber = courtCase.getCourtCaseNumber() != null ?
                               courtCase.getCourtCaseNumber() : courtCase.getCmpNumber();

            builder.oldRegCaseType(caseTypeValue)
                   .oldRegNo(numberExtractor.extractCaseNumber(caseNumber))
                   .oldRegYear(extractRegYear(caseNumber));

            log.info("Populated old case type details for CMP case: {}", courtCase.getCnrNumber());

        } else if (ST.equalsIgnoreCase(caseType)) {
            // For ST cases: use courtCaseNumber for new values and cmpNumber for old values during migration
            String caseNumber = courtCase.getCourtCaseNumber();
            String cmpNumber = courtCase.getCmpNumber();

            builder.newRegCaseType(caseTypeValue)
                   .newRegNo(numberExtractor.extractCaseNumber(caseNumber))
                   .newRegYear(extractRegYear(caseNumber));

            // Add old values using cmpNumber during migration
            if (cmpNumber != null && !cmpNumber.trim().isEmpty()) {
                Integer cmpCaseTypeValue = caseRepository.getCaseTypeCode(CMP);
                builder.oldRegCaseType(cmpCaseTypeValue)
                       .oldRegNo(numberExtractor.extractCaseNumber(cmpNumber))
                       .oldRegYear(extractRegYear(cmpNumber));
                log.info("Populated old case type details using cmpNumber for ST case with CMP case type: {}", courtCase.getCnrNumber());
            }

            log.info("Populated new case type details for ST case: {}", courtCase.getCnrNumber());

        } else {
            log.warn("Unknown case type: {} for case: {}, no case type details populated",
                    caseType, courtCase.getCnrNumber());
        }

        return builder.build();
    }

    private NJDGTransformRecord buildNJDGRecord(CourtCase courtCase, JudgeDetails judgeDetails, 
                                               DesignationMaster designationMaster, RequestInfo requestInfo) {
        log.info("Building NJDG record for case: {}", courtCase.getCnrNumber());
        
        return NJDGTransformRecord.builder()
                .cino(courtCase.getCnrNumber())
                .dateOfFiling(dateUtil.formatDate(courtCase.getFilingDate()))
                .dtRegis(dateUtil.formatDate(courtCase.getRegistrationDate()))
                .caseType(getCaseTypeValue(courtCase.getCaseType()))
                .regNo(numberExtractor.extractCaseNumber(courtCase.getCourtCaseNumber() != null ? courtCase.getCourtCaseNumber() : courtCase.getCmpNumber()))
                .regYear(extractRegYear(courtCase.getCourtCaseNumber() != null ? courtCase.getCourtCaseNumber() : courtCase.getCmpNumber()))
                .filNo(numberExtractor.extractFilingNumber(courtCase.getFilingNumber()))
                .filYear(extractFilingYear(courtCase.getFilingNumber()))
                .pendDisp(getDisposalStatus(courtCase.getOutcome()))
                .dateOfDecision(getDateOfDecision(courtCase, requestInfo))
                .dispReason(courtCase.getOutcome() != null ? 
                           getDisposalReason(courtCase.getOutcome()) : 0)
                .dispNature(getDisposalNature(courtCase))
                .desgname(designationMaster.getDesgName())
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : (properties.getCourtNumber() != null ? properties.getCourtNumber() : 0))
                .estCode(courtCase.getCourtId())
                .stateCode(properties.getStateCode())
                .distCode(getDistrictCode(courtCase))
                .purposeCode(getPurposeCode(courtCase))
                .purposePrevious(getPurposePrevious(courtCase))
                .jocode(judgeDetails != null ? judgeDetails.getJocode() : null)
                .cicriType(properties.getCicriType() != null ? properties.getCicriType() : 0)
                .dateFirstList(setDateFirstList(courtCase.getCnrNumber()))
                .dateNextList(setNextListDate(courtCase.getCnrNumber()))
                .dateLastList(setDateLastList(courtCase.getCnrNumber()))
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode() : null)
                .desigCode(designationMaster.getDesgCode())
                .build();
    }

    private LocalDate setDateLastList(String cnrNumber) {
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

    private Integer extractFilingYear(String filingNumber) {
        try {
            if (filingNumber == null || filingNumber.trim().isEmpty()) {
                log.warn("Filing number is null or empty, returning default year 0");
                return 0;
            }

            // Extract year from filing number format: KL-000013-2024
            String[] parts = filingNumber.trim().split("-");
            if (parts.length >= 3) {
                String yearPart = parts[parts.length - 1];
                Integer year = Integer.parseInt(yearPart);
                log.info("Extracted filing year {} from filing number: {}", year, filingNumber);
                return year;
            } else {
                log.warn("Filing number format invalid, expected format: XX-NNNNNN-YYYY, got: {}", filingNumber);
                return 0;
            }

        } catch (NumberFormatException e) {
            log.error("Failed to parse year from filing number: {} | error: {}", filingNumber, e.getMessage());
            return 0;
        } catch (Exception e) {
            log.error("Unexpected error extracting year from filing number: {} | error: {}", filingNumber, e.getMessage());
            return 0;
        }
    }

    private Integer extractRegYear(String caseNumber) {
        try {
            if (caseNumber == null || caseNumber.trim().isEmpty()) {
                log.warn("Case number is null or empty, returning default year 0");
                return 0;
            }

            String[] parts = caseNumber.trim().split("/");
            if (parts.length >= 3) {
                String yearPart = parts[parts.length - 1];
                Integer year = Integer.parseInt(yearPart);
                log.info("Extracted year {} from case number: {}", year, caseNumber);
                return year;
            } else {
                log.warn("Case number format invalid, expected format: type/number/year, got: {}", caseNumber);
                return 0;
            }

        } catch (NumberFormatException e) {
            log.error("Failed to parse year from case number: {} | error: {}", caseNumber, e.getMessage());
            return 0;
        } catch (Exception e) {
            log.error("Unexpected error extracting year from case number: {} | error: {}", caseNumber, e.getMessage());
            return 0;
        }
    }

    private Integer getPurposePrevious(CourtCase courtCase) {
        try {
            List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(courtCase.getCnrNumber());
            int previousPurpose = 0;

            if (hearingDetails != null && !hearingDetails.isEmpty() && hearingDetails.size() > 1) {
                int n = hearingDetails.size();
                previousPurpose = Integer.parseInt(hearingDetails.get(n - 2).getPurposeOfListing());
                log.info("Retrieved previous purpose code: {} for case CNR: {}", previousPurpose, courtCase.getCnrNumber());
            } else {
                log.info("No previous hearing details found for case CNR: {}, using default purpose code: {}",
                        courtCase.getCnrNumber(), previousPurpose);
            }
            return previousPurpose;
        } catch (Exception e) {
            log.error("Error retrieving purpose code for case CNR: {}: {}",
                    courtCase.getCnrNumber(), e.getMessage(), e);
            return 0;
        }
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
            if(INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory()) && isValidOrder(order.getOrderType(), order.getTenantId(), requestInfo)) {
                return dateUtil.formatDate(order.getCreatedDate());
            } else if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
                JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
                for(JsonNode compositeItem : compositeItems){
                    if(isValidOrder(compositeItem.get("orderType").asText(), order.getTenantId(), requestInfo)) {
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
            return 0;
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

    private Integer getDisposalReason(String outcome) {
        Integer disposalType = caseRepository.getDisposalStatus(outcome);
        if (disposalType != null) {
            log.info("Retrieved disposal reason: {} for outcome: {}", disposalType, outcome);
            return disposalType;
        }
        log.info("No disposal reason found for outcome: {}", outcome);
        return 0;
    }

    /**
     * @param courtCase The court case containing case details with cheque information
     * @return Integer district code from the database lookup, or 2 (Kollam district default) 
     *         if district name is not found or any parsing error occurs
     */
    private Integer getDistrictCode(CourtCase courtCase) {
        try {
            JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
            if (caseDetails == null || caseDetails.path("chequeDetails").isMissingNode()) {
                log.info("No cheque details found in case additional details for CNR: {}",
                        courtCase.getCnrNumber());
                return 2;
            }

            JsonNode chequeDetails = caseDetails.path("chequeDetails");
            if (chequeDetails.path("formdata").isMissingNode() ||
                    !chequeDetails.path("formdata").isArray() ||
                    chequeDetails.path("formdata").isEmpty()) {
                log.info("No formdata found in cheque details for CNR: {}", courtCase.getCnrNumber());
                return 2;
            }

            JsonNode policeStationNode = chequeDetails.path("formdata").get(0)
                    .path("data")
                    .path("policeStationJurisDictionCheque");

            if (policeStationNode.isMissingNode()) {
                log.info("No police station details found in cheque details for CNR: {}",
                        courtCase.getCnrNumber());
                return 2;
            }
            String districtName = policeStationNode.path("district").asText();
            Integer districtCode = caseRepository.getDistrictCode(districtName);
            log.info("Retrieved district code: {} for district: {} in case CNR: {}", 
                     districtCode, districtName, courtCase.getCnrNumber());
            return districtCode;
            
        } catch (Exception e) {
            log.error("Error extracting district code for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            return 2;
        }
    }

    private Integer getPurposeCode(CourtCase courtCase) {
        try {
            List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(courtCase.getCnrNumber());
            int purposeCode = 0;
            
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
                dateLastList = hearingDetails.get(hearingDetails.size() - 1).getNextDate() != null ? hearingDetails.get(hearingDetails.size() - 1).getNextDate() : hearingDetails.get(hearingDetails.size() - 1).getHearingDate();
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

    private void insertCaseConversionDetails(CourtCase courtCase, CaseTypeDetails caseTypeDetails, JudgeDetails judgeDetails) {
        try {
            String cino = courtCase.getCnrNumber();
            
            CaseTypeDetails existingDetails = caseRepository.getExistingCaseConversionDetails(cino);

            if (existingDetails != null) {
                log.info("Existing case conversion details found for CINO: {}, adding new record", cino);
                
                existingDetails.setNewRegCaseType(caseTypeDetails.getNewRegCaseType());
                existingDetails.setNewRegNo(caseTypeDetails.getNewRegNo());
                existingDetails.setNewRegYear(caseTypeDetails.getNewRegYear());
                

                String jocode = judgeDetails != null ? judgeDetails.getJocode() : null;
                existingDetails.setCino(cino);
                existingDetails.setJocode(jocode);
                producer.push("save-case-conversion-details", existingDetails);
                log.info("Successfully added new case conversion record for CINO: {} with sr_no: {}", cino, existingDetails.getSrNo());
                
            } else {
                log.info("No existing case conversion details found for CINO: {}, adding first record", cino);
                
                Integer srNo = 1;
                
                String jocode = judgeDetails != null ? judgeDetails.getJocode() : null;
                caseTypeDetails.setCino(cino);
                caseTypeDetails.setJocode(jocode);
                caseTypeDetails.setSrNo(srNo);
                producer.push("save-case-conversion-details", caseTypeDetails);
                log.info("Successfully added first case conversion record for CINO: {} with sr_no: {}", cino, srNo);
            }

        } catch (Exception e) {
            log.error("Failed to save case conversion details for CINO: {} | error: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
        }
    }

    private Integer getDisposalNature(CourtCase courtCase) {
        try {
            if (courtCase.getNatureOfDisposal() != null) {
                return switch (courtCase.getNatureOfDisposal()) {
                    case CONTESTED -> {
                        log.info("Case {} has contested nature of disposal", courtCase.getCnrNumber());
                        yield 1;
                    }
                    case UNCONTESTED -> {
                        log.info("Case {} has uncontested nature of disposal", courtCase.getCnrNumber());
                        yield 2;
                    }
                    default -> {
                        log.warn("Unknown nature of disposal: {} for case: {}",
                                courtCase.getNatureOfDisposal(), courtCase.getCnrNumber());
                        yield 0;
                    }
                };
            } else {
                log.info("No nature of disposal provided for case: {}, defaulting to 0", courtCase.getCnrNumber());
                return 0;
            }
        } catch (Exception e) {
            log.error("Error determining disposal nature for case: {} | error: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            return 0;
        }
    }

    private boolean isValidOrder(String orderType, String tenantId, RequestInfo requestInfo) {
        Map<String, Map<String, JSONArray>> caseOutcomes =mdmsUtil.fetchMdmsData(requestInfo, tenantId, "case", List.of("OutcomeType"));
        JSONArray outcomeData = caseOutcomes.get("case").get("OutcomeType");
        for (Object hearingStatusObject : outcomeData) {
            String outcomeOrderType = jsonUtil.getNestedValue(hearingStatusObject, List.of("orderType"), String.class);
            if(orderType != null && orderType.equalsIgnoreCase(outcomeOrderType)){
                return true;
            }
        }
        return false;
    }
}
