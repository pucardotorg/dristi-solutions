package org.pucar.dristi.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.workflow.ProcessInstance;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessInstanceObject extends ProcessInstance {
    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;
}
