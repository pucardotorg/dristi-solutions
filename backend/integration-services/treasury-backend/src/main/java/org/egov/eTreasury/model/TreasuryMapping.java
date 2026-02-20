package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreasuryMapping {

    @JsonProperty("consumerCode")
    private String consumerCode;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("headAmountMapping")
    private Object headAmountMapping;

    @JsonProperty("calculation")
    private Calculation calculation;

    @JsonProperty("createdTime")
    private Long createdTime;

    @JsonProperty("lastModifiedTime")
    private Long lastModifiedTime;

    @JsonProperty("finalCalcPostResubmission")
    private Calculation finalCalcPostResubmission;

    @JsonProperty("lastSubmissionConsumerCode")
    private String lastSubmissionConsumerCode;
}
