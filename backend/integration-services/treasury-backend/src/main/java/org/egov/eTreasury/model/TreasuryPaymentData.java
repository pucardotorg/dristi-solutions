package org.egov.eTreasury.model;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class TreasuryPaymentData {

    private String tenantId;

    private String grn;

    private String challanTimestamp;

    private String bankRefNo;

    private String bankTimestamp;

    private String bankCode;

    private char status;

    private String cin;

    private BigDecimal amount;

    private String partyName;

    private String departmentId;

    private String remarkStatus;

    private String remarks;

    private String fileStoreId;

    private String billId;

    private double totalDue;

    private String mobileNumber;

    private String paidBy;

    private String businessService;


    private String caseType;

    private String caseName;

    private String caseNumber;

    private String purposeOfPayment;

    private double courtFee;

    private double advocateWelfareFund;

    private double advocateClerkWelfareFund;

    private double legalBenefitFee;

    private double epostFee;

    private double delayCondonationFee;

    private double complaintFee;

    private double applicationFee;

    private double petitionFee;

    private double totalAmount;

    private List<FeeBreakDown> feeBreakDown;

    private Object requestBlob;

    private Object responseBlob;
}