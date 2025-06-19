package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.Map;

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

    @JsonProperty("reSubmissionBreakDown")
    private List<Calculation> reSubmissionBreakDown;

    @JsonProperty("lastSubmissionConsumerCode")
    private String lastSubmissionConsumerCode;
}
