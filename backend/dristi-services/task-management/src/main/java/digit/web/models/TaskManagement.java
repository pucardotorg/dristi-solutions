package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

import digit.web.models.enums.PartyType;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * TaskManagement
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
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

    @JsonProperty("documents")
    private List<Document> documents;

    @JsonProperty("partyType")
    private PartyType partyType;

}
