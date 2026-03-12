package org.pucar.dristi.web.models.ctcApplication;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.web.models.taskManagement.Pagination;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CtcApplicationSearchRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("criteria")
    private CtcApplicationSearchCriteria criteria;

    @JsonProperty("pagination")
    @Valid
    @NotNull
    private Pagination pagination = null;

}
