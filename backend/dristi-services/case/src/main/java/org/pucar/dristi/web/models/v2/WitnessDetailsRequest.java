package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
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
