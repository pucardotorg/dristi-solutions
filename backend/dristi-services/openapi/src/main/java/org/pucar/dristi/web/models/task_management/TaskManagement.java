package org.pucar.dristi.web.models.task_management;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.WorkflowObject;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskManagement {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber = null;

    @JsonProperty("courtId")
    @Valid
    private String courtId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("taskType")
    @Valid
    @NotNull
    private String taskType = null;

    @JsonProperty("taskManagementNumber")
    private String taskManagementNumber = null;

    @JsonProperty("tenantId")
    @NotNull
    @Valid
    private String tenantId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("partyDetails")
    private List<PartyDetails> partyDetails;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow;

}
