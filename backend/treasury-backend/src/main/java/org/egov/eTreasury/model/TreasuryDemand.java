package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreasuryDemand {

    @JsonProperty("consumerCode")
    private String consumerCode;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("headAmountMapping")
    private Map<String, Object> headAmountMapping;
}
