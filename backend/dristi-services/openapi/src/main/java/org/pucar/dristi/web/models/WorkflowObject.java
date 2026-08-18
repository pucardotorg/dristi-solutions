package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.models.Workflow;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowObject extends Workflow {
    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;
}
