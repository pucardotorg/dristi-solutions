package pucar.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import pucar.web.models.WorkflowObject;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskManagement {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("caseFilingNumber")
    private String caseFilingNumber;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("taskType")
    private String taskType; //Notice, Summons

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("orderNumber")
    private String orderNumber;

    @JsonProperty("status")
    private String status;

    @JsonProperty("partyDetails")
    private List<PartyDetails> partyDetails;

    @JsonProperty("additionalDetails")
    private Object additionalDetails;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

    @JsonProperty("workflow")
    private WorkflowObject workflow;
}
