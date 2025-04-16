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
import org.egov.eTreasury.util.DemandUtil;
import org.egov.eTreasury.util.IdgenUtil;
import org.egov.eTreasury.util.MdmsUtil;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class TreasuryEnrichment {

    private final PaymentConfiguration config;

    private final IdgenUtil idgenUtil;

    private final TreasuryMappingRepository repository;

    private final ObjectMapper objectMapper;

    private final MdmsUtil mdmsUtil;

    private final DemandUtil demandUtil;
    public TreasuryEnrichment(PaymentConfiguration config, IdgenUtil idgenUtil, TreasuryMappingRepository repository, ObjectMapper objectMapper, MdmsUtil mdmsUtil, DemandUtil demandUtil) {
        this.config = config;
        this.idgenUtil = idgenUtil;
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.mdmsUtil = mdmsUtil;
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

        String consumerCode = demandUtil.searchBill(challanData.getBillId(), requestInfo);
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
}
