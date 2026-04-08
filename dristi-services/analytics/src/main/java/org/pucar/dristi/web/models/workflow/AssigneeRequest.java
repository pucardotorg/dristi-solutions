package org.pucar.dristi.web.models.workflow;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AssigneeRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    private RequestInfo requestInfo;

    @JsonProperty("assignees")
    @Valid
    @NotNull
    private List<Assignee> assignees;

}
