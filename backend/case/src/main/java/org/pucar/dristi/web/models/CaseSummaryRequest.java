package org.pucar.dristi.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class CaseSummaryRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

    @JsonProperty("criteria")
    @Valid
    private CaseSearchCriteria criteria = null;


}
