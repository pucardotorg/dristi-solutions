package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WitnessDetailsRequest {


    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("caseFilingNumber")
    private String caseFilingNumber;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("witnessDetails")
    private List<WitnessDetails> witnessDetails;
}
