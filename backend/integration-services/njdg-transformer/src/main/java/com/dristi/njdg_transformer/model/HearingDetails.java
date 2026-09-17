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
public class HearingDetails {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("cino")
    private String cino;

    @JsonProperty("sr_no")
    private Integer srNo;

    @JsonProperty("desg_name")
    private String desgName;

    @JsonProperty("hearing_date")
    private LocalDate hearingDate;

    @JsonProperty("next_date")
    private LocalDate nextDate;

    @JsonProperty("purpose_of_listing")
    private String purposeOfListing;

    @JsonProperty("judge_code")
    private String judgeCode;

    @JsonProperty("jo_code")
    private String joCode;

    @JsonProperty("desg_code")
    private String desgCode;

    @JsonProperty("hearing_id")
    private String hearingId;

    @JsonProperty("business")
    private String business;

    @JsonProperty("court_no")
    private Integer courtNo;

    @JsonProperty("nextPurpose")
    private String nextPurpose;

    @JsonProperty("orderId")
    private String orderId;
}
