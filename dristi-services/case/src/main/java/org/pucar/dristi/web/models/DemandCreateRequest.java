package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DemandCreateRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo = null;

    @JsonProperty("consumerCode")
    private String consumerCode = null;

    @JsonProperty("calculation")
    private List<Calculation> calculation = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("entityType")
    private String entityType = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("finalCalcPostResubmission")
    private Calculation finalCalcPostResubmission = null;

    @JsonProperty("lastSubmissionConsumerCode")
    private String lastSubmissionConsumerCode = null;
}