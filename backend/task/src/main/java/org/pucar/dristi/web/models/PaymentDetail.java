package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;
import org.egov.tracer.model.AuditDetails;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode
public class PaymentDetail {

    @Size(max = 64)
    @JsonProperty("id")
    private String id;

    @Size(max = 64)
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("totalDue")
    private BigDecimal totalDue;

    @NotNull
    @JsonProperty("totalAmountPaid")
    private BigDecimal totalAmountPaid;

    @Size(max = 64)
    @JsonProperty("receiptNumber")
    private String receiptNumber;

    @Size(max = 64)
    @JsonProperty("manualReceiptNumber")
    private String manualReceiptNumber;

    @JsonProperty("manualReceiptDate")
    private Long manualReceiptDate;

    @JsonProperty("receiptDate")
    private Long receiptDate;

    @JsonProperty("receiptType")
    private String receiptType;

    @JsonProperty("businessService")
    private String businessService;

    @NotNull
    @Size(max = 64)
    @JsonProperty("billId")
    private String billId;

    @JsonProperty("bill")
    private Bill bill;

    @JsonProperty("additionalDetails")
    private JsonNode additionalDetails;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

}