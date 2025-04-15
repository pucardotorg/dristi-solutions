package org.egov.eTreasury.model.demand;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.model.Calculation;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandCreateRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo = null;

    @JsonProperty("consumerCode")
    private String consumerCode = null;

    @JsonProperty("calculation")
    private List<Calculation> calculation = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("deliveryChannel")
    private String deliveryChannel = null;

    @JsonProperty("entityType")
    private String entityType = null;

    @JsonProperty("tenantId")
    private String tenantId = null;


}
