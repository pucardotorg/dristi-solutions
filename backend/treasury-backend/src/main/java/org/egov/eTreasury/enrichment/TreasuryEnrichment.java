package org.egov.eTreasury.enrichment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.*;
import org.egov.eTreasury.repository.TreasuryMappingRepository;
import org.egov.eTreasury.util.CaseUtil;
import org.egov.eTreasury.util.DemandUtil;
import org.egov.eTreasury.util.IdgenUtil;
import org.egov.eTreasury.util.MdmsUtil;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.egov.eTreasury.config.ServiceConstants.*;

@Component
@Slf4j
public class TreasuryEnrichment {

    private final PaymentConfiguration config;

    private final IdgenUtil idgenUtil;

    private final TreasuryMappingRepository repository;

    private final ObjectMapper objectMapper;

    private final MdmsUtil mdmsUtil;

    private final CaseUtil caseUtil;

    private final DemandUtil demandUtil;
    public TreasuryEnrichment(PaymentConfiguration config, IdgenUtil idgenUtil, TreasuryMappingRepository repository, ObjectMapper objectMapper, MdmsUtil mdmsUtil, CaseUtil caseUtil, DemandUtil demandUtil) {
        this.config = config;
        this.idgenUtil = idgenUtil;
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.mdmsUtil = mdmsUtil;
        this.caseUtil = caseUtil;
        this.demandUtil = demandUtil;
    }

    public ChallanDetails generateChallanDetails(ChallanData challanData, RequestInfo requestInfo) throws JsonProcessingException {


        String departmentId = config.getTreasuryIdPrefix() + idgenUtil.getIdList(requestInfo,config.getEgovStateTenantId(),config.getIdName(),null,1).get(0);
        String challanAmount;
        if (config.isTest()) {
            challanAmount = String.valueOf(config.getChallanTestAmount());
        } else {
            challanAmount = String.valueOf(challanData.getTotalDue());
        }
        log.info("Challan Amount: {}", challanAmount);
        log.info("eTreasury in test mode: {}", config.isTest());


        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo, config.getEgovStateTenantId(), "payment", List.of("tsbAccountToHead"));
        Map<String, JSONArray> tsbMasterData = mdmsData.get("payment");
        JsonNode tsbAccountToHead = objectMapper.convertValue(tsbMasterData.get("tsbAccountToHead"), JsonNode.class);

        String consumerCode = demandUtil.searchBill(challanData.getBillId(), requestInfo).get("consumerCode").textValue();
        TreasuryMapping treasuryMapping = repository.getTreasuryMapping(consumerCode);
        JsonNode headAmountMapping = objectMapper.readTree(treasuryMapping.getHeadAmountMapping().toString());
        List<HeadDetails> headDetailsList = new ArrayList<>();

        for(JsonNode headAmount : headAmountMapping.get("breakUpList")) {
            for(JsonNode head : headAmount.get("headIdList")) {
                String amount = String.valueOf(head.get("amount").asDouble());
                String headId = head.get("id").asText();
                boolean found = false;
                for (HeadDetails headDetails : headDetailsList) {
                    if (headDetails.getHeadId().equalsIgnoreCase(headId)) {
                        double updatedAmount = Double.parseDouble(String.valueOf(Double.parseDouble(headDetails.getAmount()) + Double.parseDouble(amount)));
                        headDetails.setAmount(String.valueOf(updatedAmount));
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    headDetailsList.add(HeadDetails.builder()
                            .amount(String.valueOf(Double.parseDouble(amount)))
                            .headId(headId)
                            .build());
                }
            }
        }
        // for staging testing
        if(config.isTest()) {
            String amount = String.valueOf(Double.parseDouble(config.getChallanTestAmount())/(headDetailsList.size()));
            for(HeadDetails headDetails : headDetailsList) {
                headDetails.setAmount(amount);
            }
        }
        List<TsbData> tsbData = new ArrayList<>();
        String tsbReceipt = config.getTsbReceipt();
        for(JsonNode tsbAccount : tsbAccountToHead) {
            if(isIsTsbAccount(tsbAccount) && containsTsbAccount(headDetailsList, tsbAccount.get("headId").asText())) {
                tsbReceipt = "Y";
                tsbData.add(TsbData.builder()
                        .tsbAccNo(tsbAccount.get("tsbAccountNumber").asText())
                        .tsbAccType(tsbAccount.get("tsbAccountType").asText())
                        .tsbAmount(getTsbAmount(headDetailsList, tsbAccount.get("headId").asText()))
                        .tsbPurpose("Fee")
                        .build());
            }
        }



        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate currentDate = LocalDate.now();
        String formattedDate = currentDate.format(formatter);

        return ChallanDetails.builder()
                .fromDate(formattedDate)
                .toDate(formattedDate)
                .paymentMode("E")
                .challanAmount(challanAmount)
                .noOfHeads(String.valueOf(headDetailsList.size()))
                .headsDet(headDetailsList)
                .departmentId(departmentId)
                .serviceDeptCode(config.getServiceDeptCode())
                .officeCode(config.getOfficeCode())
                .partyName(challanData.getPaidBy())
                .tsbReceipts(tsbReceipt)
                .tsbData(tsbData)
                .build();
    }

    private static boolean isIsTsbAccount(JsonNode tsbAccount) {
        return tsbAccount.get("isTsbAccount").asBoolean();
    }

    private boolean containsTsbAccount(List<HeadDetails> headDetailsList, String headId) {
        for(HeadDetails headDetails : headDetailsList) {
            if(headDetails.getHeadId().equals(headId)) {
                return true;
            }
        }
        return false;
    }

    private Double getTsbAmount(List<HeadDetails> headDetailsList, String headId) {
        for (HeadDetails headDetails : headDetailsList) {
            if (headDetails.getHeadId().equalsIgnoreCase(headId)) {
                return Double.parseDouble(headDetails.getAmount());
            }
        }
        return 1.0;
    }

    public void enrichTreasuryPaymentData(TreasuryPaymentData data, RequestInfo requestInfo) {
        try {
            log.info("operation=enrichTreasuryPaymentData, result=IN_PROCESS");
            JsonNode bill = demandUtil.searchBill(data.getBillId(), requestInfo);
            JsonNode additionalDetails = bill.get("billDetails").get(0).get("additionalDetails");
            String filingNumber = additionalDetails.get("filingNumber").textValue();
            CourtCase courtCase = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                    .criteria(Collections.singletonList(CaseCriteria.builder().defaultFields(false).filingNumber(filingNumber).build()))
                    .requestInfo(requestInfo).build());

            data.setCaseName(courtCase.getCaseTitle());
            data.setCaseNumber(courtCase.getFilingNumber());
            data.setCaseType(CASE_TYPE);
            data.setPurposeOfPayment("E Filing Fees");

            TreasuryMapping treasuryMapping = repository.getTreasuryMapping(bill.get("consumerCode").textValue());
            Calculation calculation = treasuryMapping.getCalculation();
            List<BreakDown> breakDowns = calculation.getBreakDown();
            for(BreakDown breakDown : breakDowns){
                switch (breakDown.getCode()) {
                    case COURT_FEE -> data.setCourtFee(breakDown.getAmount());
                    case ADVOCATE_WELFARE_FUND -> data.setAdvocateWelfareFund(breakDown.getAmount());
                    case ADVOCATE_CLERK_WELFARE_FUND -> data.setAdvocateClerkWelfareFund(breakDown.getAmount());
                    case LEGAL_BENEFIT_FEE -> data.setLegalBenefitFee(breakDown.getAmount());
                    case EPOST_FEE -> data.setEpostFee(breakDown.getAmount());
                    case DELAY_CONDONATION_FEE -> data.setDelayCondonationFee(breakDown.getAmount());
                    case COMPLAINT_FEE -> data.setComplaintFee(breakDown.getAmount());
                    case APPLICATION_FEE -> data.setApplicationFee(breakDown.getAmount());
                    case PETITION_FEE -> data.setPetitionFee(breakDown.getAmount());
                }
            }
            double totalAmount = data.getCourtFee() + data.getAdvocateWelfareFund() + data.getAdvocateClerkWelfareFund() + data.getLegalBenefitFee() + data.getEpostFee() + data.getDelayCondonationFee() + data.getComplaintFee() + data.getApplicationFee() + data.getPetitionFee();
            data.setTotalAmount(totalAmount);
            buildFeeBreakDown(data);
            log.info("operation=enrichTreasuryPaymentData, result=SUCCESS");
        } catch (Exception e) {
            log.error("operation=enrichTreasuryPaymentData, result=Failure");
            throw new CustomException("ERROR_ENRICH_PAYMENT", "Error enriching payment data.");
        }
    }
    private void buildFeeBreakDown(TreasuryPaymentData data) {
        List<FeeBreakDown> fees = new ArrayList<>();
        if (data.getCourtFee() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Court Fee:")
                    .feeAmount(data.getCourtFee())
                    .build());
        }

        if (data.getAdvocateWelfareFund() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Fee for Advocate Welfare Fund:")
                    .feeAmount(data.getAdvocateWelfareFund())
                    .build());
        }

        if (data.getAdvocateClerkWelfareFund() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Fee for Clerk Welfare Fund:")
                    .feeAmount(data.getAdvocateClerkWelfareFund())
                    .build());
        }

        if (data.getLegalBenefitFee() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Legal Benefit Fund:")
                    .feeAmount(data.getLegalBenefitFee())
                    .build());
        }

        if (data.getEpostFee() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Epost Fee:")
                    .feeAmount( data.getEpostFee())
                    .build());
        }

        if (data.getDelayCondonationFee() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Delay Condonation Fee:")
                    .feeAmount(data.getDelayCondonationFee())
                    .build());
        }

        if (data.getComplaintFee() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Complaint Fee:")
                    .feeAmount(data.getComplaintFee())
                    .build());
        }

        if (data.getApplicationFee() > 0) {
            fees.add(FeeBreakDown.builder()
                    .feeName("Application Fee:")
                    .feeAmount(data.getApplicationFee())
                    .build());
        }

        data.setFeeBreakDown(fees);
    }

    public String enrichGrn(RequestInfo requestInfo) {
        return idgenUtil.getIdList(requestInfo, config.getEgovStateTenantId(), config.getMockGrnName(), null, 1).get(0);
    }
}