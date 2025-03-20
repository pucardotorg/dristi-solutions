package org.egov.eTreasury.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.ChallanData;
import org.egov.eTreasury.model.ChallanDetails;
import org.egov.eTreasury.model.HeadDetails;
import org.egov.eTreasury.model.TsbData;
import org.egov.eTreasury.util.IdgenUtil;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class TreasuryEnrichment {

    private final PaymentConfiguration config;

    private final IdgenUtil idgenUtil;

    public TreasuryEnrichment(PaymentConfiguration config, IdgenUtil idgenUtil) {
        this.config = config;
        this.idgenUtil = idgenUtil;
    }

    public ChallanDetails generateChallanDetails(ChallanData challanData, RequestInfo requestInfo) {

        String departmentId = idgenUtil.getIdList(requestInfo, config.getEgovStateTenantId(), config.getIdName(), null, 1).get(0);

        String challanAmount;
        if (config.isTest()) {
            challanAmount = String.valueOf(config.getChallanTestAmount());
        } else {
            challanAmount = String.valueOf(challanData.getTotalDue());
        }
        log.info("Challan Amount: {}", challanAmount);
        log.info("eTreasury in test mode: {}", config.isTest());

        int headSize = config.getHeadsList().size();
        String noOfHeads = String.valueOf(headSize);
        List<HeadDetails> headDetailsList = new ArrayList<>();

        for (String head : config.getHeadsList()) {
            headDetailsList.add(HeadDetails.builder()
                    .amount(String.valueOf(Integer.parseInt(challanAmount) / headSize))
                    .headId(head)
                    .build());
        }

        List<String> accountTypeList = config.getAccountTypeList();

        List<String> accountNumberList = config.getAccountNumberList();

        if (!(accountTypeList.size() == accountNumberList.size())) {
            throw new CustomException("CHECK_SIZE_NIGGA", "Check size of account type and account number");
        }

        List<TsbData> tsbData = new ArrayList<>();
        for (int i = 0; i < accountNumberList.size(); i++){
            tsbData.add(TsbData.builder().tsbAccNo(accountNumberList.get(i))
                    .tsbAccType(accountTypeList.get(i))
                    .tsbAmount(1.0)
                    .tsbPurpose("Fee").build());
        }



        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate currentDate = LocalDate.now();
        String formattedDate = currentDate.format(formatter);

        return ChallanDetails.builder()
                .fromDate(formattedDate)
                .toDate(formattedDate)
                .paymentMode("E")
                .challanAmount(challanAmount)
                .noOfHeads(noOfHeads)
                .headsDet(headDetailsList)
                .departmentId(departmentId)
                .serviceDeptCode(config.getServiceDeptCode())
                .officeCode(config.getOfficeCode())
                .partyName(challanData.getPaidBy())
                .tsbReceipts(config.getTsbReceipt())
                .tsbData(tsbData)
                .build();
    }
}
