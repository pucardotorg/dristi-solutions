package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterimOrder {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("cino")
    private String cino;

    @JsonProperty("sr_no")
    private Integer srNo;

    @JsonProperty("order_date")
    private LocalDate orderDate;

    @JsonProperty("order_no")
    private Integer orderNo;

    @JsonProperty("order_details")
    private byte[] orderDetails;

    @JsonProperty("order_number")
    private String courtOrderNumber;

    @JsonProperty("order_type")
    private String orderType;

    @JsonProperty("doc_type")
    private Integer docType;

    @JsonProperty("jocode")
    private String joCode;

    @JsonProperty("disp_reason")
    private Integer dispReason;

    @JsonProperty("court_no")
    private Integer courtNo;

    @JsonProperty("judge_code")
    private Integer judgeCode;

    @JsonProperty("desig_code")
    private Integer desigCode;
}
