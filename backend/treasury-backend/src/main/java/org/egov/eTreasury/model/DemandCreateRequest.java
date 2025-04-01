package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandCreateRequest {

    @JsonProperty("requestInfo")
    private RequestInfo requestInfo = null;

    @JsonProperty("consumerCode")
    private String consumerCode = null;

    @JsonProperty("breakDown")
    private List<BreakUp> breakDown = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("entityType")
    private String entityType = null;

    @JsonProperty("tenantId")
    private String tenantId = null;


}
