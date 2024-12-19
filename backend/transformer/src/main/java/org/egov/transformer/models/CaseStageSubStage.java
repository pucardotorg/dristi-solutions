package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;


@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseStageSubStage {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo = null;

    @JsonProperty("caseOverallStatus")
    private CaseOverallStatus caseOverallStatus = null;

}
