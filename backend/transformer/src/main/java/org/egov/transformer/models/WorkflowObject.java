package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.models.Workflow;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowObject extends Workflow {
    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;
}
