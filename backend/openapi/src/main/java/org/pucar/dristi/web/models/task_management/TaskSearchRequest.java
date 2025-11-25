package org.pucar.dristi.web.models.task_management;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.web.models.Pagination;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskSearchRequest {
    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    @NotNull
    private TaskSearchCriteria criteria = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;


}
