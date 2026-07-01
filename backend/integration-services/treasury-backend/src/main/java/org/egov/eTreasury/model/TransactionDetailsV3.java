package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransactionDetailsV3 {

    @JsonProperty("grn")
    private String grn;

    @JsonProperty("challantimestamp")
    private String challanTimestamp;

    @JsonProperty("bankrefno")
    private String bankRefNo;

    @JsonProperty("cin")
    private String cin;

    @JsonProperty("banktimestamp")
    private String bankTimestamp;

    @JsonProperty("amount")
    private String amount;

    @JsonProperty("status")
    private String status;

    @JsonProperty("bank_code")
    private String bankCode;

    @JsonProperty("remarks")
    private String remarks;

    @JsonProperty("department_id")
    private String departmentId;

    @JsonProperty("partyname")
    private String partyName;

    @JsonProperty("officecode")
    private String officeCode;

    @JsonProperty("deface_flag")
    private String defaceFlag;

    @JsonProperty("error")
    private String error;

    @JsonProperty("service_dept_code")
    private String serviceDeptCode;

    public TransactionDetails toTransactionDetails() {
        return new TransactionDetails(
                trim(grn),
                trim(departmentId),
                trim(challanTimestamp),
                trim(bankRefNo),
                trim(cin),
                trim(bankTimestamp),
                trim(amount),
                trim(status),
                trim(bankCode),
                trim(remarks),
                null,
                trim(partyName),
                trim(officeCode),
                trim(defaceFlag),
                trim(error),
                trim(serviceDeptCode)
        );
    }

    private String trim(String s) {
        return s == null ? null : s.trim();
    }
}
