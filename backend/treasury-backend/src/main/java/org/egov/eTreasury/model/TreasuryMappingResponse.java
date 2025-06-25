package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.response.ResponseInfo;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreasuryMappingResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("TreasuryHeadMapping")
    private TreasuryMapping treasuryMapping;
}
