package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.enrichment.CaseEnrichment;
import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.AdvocateMapping;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderCriteria;
import com.dristi.njdg_transformer.model.order.OrderListResponse;
import com.dristi.njdg_transformer.model.order.OrderSearchRequest;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.dristi.njdg_transformer.utils.OrderUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

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
    private final OrderRepository orderRepository;
    private final HearingRepository hearingRepository;
    private final OrderUtil orderUtil;
    private final AdvocateRepository advocateRepository;

    public NJDGTransformRecord processAndUpdateCase(CourtCase courtCase, RequestInfo requestInfo) {
        try {
            NJDGTransformRecord record = convertToNJDGRecord(courtCase, requestInfo);
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
        //todo: configuring for single act, need to configure for multiple
        List<Act> acts = caseRepository.getActs(courtCase.getCnrNumber());
        if(!acts.isEmpty()) {
            return;
        }
        Act actMaster = caseRepository.getActMaster(ACT_NAME);
        if(actMaster != null){
            Act newAct = Act.builder()
                    .id(acts.size()+1)
                    .cino(courtCase.getCnrNumber())
                    .actCode(actMaster.getActCode())
                    .actName(actMaster.getActName())
                    .actSection(courtCase.getStatutesAndSections() != null && 
                            !courtCase.getStatutesAndSections().isEmpty() &&
                            courtCase.getStatutesAndSections().get(0).getSubsections() != null &&
                            !courtCase.getStatutesAndSections().get(0).getSubsections().isEmpty() ?
                            courtCase.getStatutesAndSections().get(0).getSubsections().get(0) : null)
                    .build();
            producer.push("save-act-details", newAct);
        }
    }

    private void processAndUpdateExtraParties(CourtCase courtCase) {
        try {
            // 1️⃣ Fetch all extra parties
            List<PartyDetails> extraParties = getAllExtraParties(courtCase);

            // 2️⃣ Push extra parties to Kafka if present
            if (!extraParties.isEmpty()) {
                producer.push("save-extra-parties", extraParties);
            }

            // 3️⃣ Process and push extra advocates
            List<ExtraAdvocateDetails> extraAdvocates = buildExtraAdvocates(courtCase, extraParties);
            if (!extraAdvocates.isEmpty()) {
                producer.push("save-extra-advocate-details", extraAdvocates);
            }

        } catch (Exception e) {
            log.error("Error processing extra parties for case {}: {}", courtCase.getCnrNumber(), e.getMessage(), e);
        }
    }

    private List<ExtraAdvocateDetails> buildExtraAdvocates(CourtCase courtCase, List<PartyDetails> extraParties) {
        List<ExtraAdvocateDetails> extraAdvocatesList = new ArrayList<>();

        for (PartyDetails party : extraParties) {
            String individualId = party.getPartyId();
            if (individualId == null) continue;

            String partyType = party.getPartyType() == PartyType.PET ? COMPLAINANT_PRIMARY : RESPONDENT_PRIMARY;

            List<ExtraAdvocateDetails> existingAdvocates = caseRepository
                    .getExtraAdvocateDetails(courtCase.getCnrNumber(), COMPLAINANT_PRIMARY.equalsIgnoreCase(partyType) ? 1 : 2)
                    .stream()
                    .filter(existingAdvocate -> Objects.equals(existingAdvocate.getPartyNo(), party.getSrNo()))
                    .toList();

            List<String> advocateIds = courtCase.getRepresentatives().stream()
                    .filter(mapping -> mapping.getRepresenting().stream()
                            .anyMatch(p -> individualId.equalsIgnoreCase(p.getIndividualId())))
                    .map(AdvocateMapping::getAdvocateId)
                    .toList();

            if (existingAdvocates.isEmpty() && advocateIds.isEmpty()) {
                log.info("No existing or extra advocates found for party {}", party.getPartyName());
                continue;
            }



        }

        return extraAdvocatesList;
    }


    private List<PartyDetails> getAllExtraParties(CourtCase courtCase) {
        List<PartyDetails> extraComplainants = caseEnrichment.getComplainantExtraParties(courtCase);
        List<PartyDetails> extraRespondents = caseEnrichment.getRespondentExtraParties(courtCase);

        List<PartyDetails> extraParties = new ArrayList<>();
        extraParties.addAll(extraComplainants);
        extraParties.addAll(extraRespondents);

        // Assign serial numbers
        for (int i = 0; i < extraParties.size(); i++) {
            extraParties.get(i).setSrNo(i + 1);
        }
        return extraParties;
    }


    private NJDGTransformRecord convertToNJDGRecord(CourtCase courtCase, RequestInfo requestInfo) {
        JudgeDetails judgeDetails = caseRepository.getJudge(courtCase.getJudgeId());
        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);
        return NJDGTransformRecord.builder()
                .cino(courtCase.getCnrNumber())
                .dateOfFiling(formatDate(courtCase.getFilingDate()))
                .dtRegis(formatDate(courtCase.getRegistrationDate()))
                .caseType(getCaseTypeValue(courtCase.getCaseType()))
                .filNo(extractFilingNumber(courtCase.getFilingNumber()))
                .filYear(extractYear(courtCase.getFilingDate()))
                .regNo(extractCaseNumber(courtCase.getCourtCaseNumber() != null ? courtCase.getCourtCaseNumber() : courtCase.getCmpNumber()))
                .regYear(extractYear(courtCase.getRegistrationDate()))
                .pendDisp(getDisposalStatus(courtCase.getOutcome()))
                .dateOfDecision(getDateOfDecision(courtCase, requestInfo))
                .dispReason(courtCase.getOutcome() != null ? getDisposalReason(courtCase.getOutcome()) : "")
                .dispNature(courtCase.getOutcome() != null ? getDisposalNature(courtCase.getOutcome()) : null)
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

    private Character getDisposalNature(String outcome) {
        String dispNature = caseRepository.getDisposalNature(outcome);
        if(CONTESTED.equalsIgnoreCase(dispNature)) {
            return '1';
        } else if(UNCONTESTED.equalsIgnoreCase(dispNature)) {
            return '2';
        }
        return null;
    }

    private LocalDate getDateOfDecision(CourtCase courtCase, RequestInfo requestInfo) {
        OrderCriteria criteria = OrderCriteria.builder()
                .filingNumber(courtCase.getFilingNumber())
                .status(PUBLISHED_ORDER)
                .tenantId(courtCase.getTenantId())
                .build();
        OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                .criteria(criteria)
                .requestInfo(requestInfo).build();
        OrderListResponse orderListResponse = orderUtil.getOrders(searchRequest);
        List<Order> orders = orderListResponse.getList();
        for (Order order : orders){
            if(orderTypes.contains(order.getOrderType().toUpperCase()) && PUBLISHED_ORDER.equalsIgnoreCase(order.getStatus())) {
                return formatDate(order.getCreatedDate());
            }
        }
        return null;
    }

    private LocalDate setDateFirstList(String cnrNumber) {
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cnrNumber);
        LocalDate dateFirstList  = null;
        if(hearingDetails != null && !hearingDetails.isEmpty()) {
            dateFirstList = hearingDetails.get(0).getHearingDate();
        }
        return dateFirstList;
    }

    private LocalDate setNextListDate(String cnrNumber) {
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cnrNumber);
        LocalDate dateLastList = null;
        if(hearingDetails != null && !hearingDetails.isEmpty()) {
            dateLastList = hearingDetails.get(hearingDetails.size()-1).getHearingDate();
        }
        return dateLastList;
    }

    private Integer getPurposeCode(CourtCase courtCase) {
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(courtCase.getCnrNumber());
        Integer purposeCode = null;
        if(hearingDetails != null && !hearingDetails.isEmpty()) {
            int n = hearingDetails.size();
            purposeCode =  Integer.valueOf(hearingDetails.get(n-1).getPurposeOfListing());
        }
        return purposeCode;
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

    public NJDGTransformRecord getNjdgTransformRecord(String cino) {
        NJDGTransformRecord record = caseRepository.findByCino(cino);

        if (record == null) {
            log.error("No record found for cino:: {}", cino);
            return null;
        }

//        // Fetch and set interim orders
//        List<InterimOrder> interimOrders = orderRepository.getInterimOrderByCino(cino);
//        record.setInterimOrders(interimOrders != null ? interimOrders : new ArrayList<>());

        // Fetch and set complainant parties
        List<PartyDetails> complainantParty = caseRepository.getPartyDetails(cino, PartyType.PET);
        record.setPetExtraParty(complainantParty != null ? complainantParty : new ArrayList<>());

        // Fetch and set respondent parties
        List<PartyDetails> respondentParty = caseRepository.getPartyDetails(cino, PartyType.RES);
        record.setResExtraParty(respondentParty != null ? respondentParty : new ArrayList<>());

        // Fetch and set hearing history
        List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cino);
        record.setHistoryOfCaseHearing(hearingDetails != null ? hearingDetails : new ArrayList<>());

        // Fetch and set acts
        List<Act> actDetails = caseRepository.getActs(cino);
        record.setActs(actDetails != null ? actDetails : new ArrayList<>());

        return record;
    }
}
