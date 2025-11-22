package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A task is created as part of an Order. It will always be linked to an order
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Task {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("orderId")
    private UUID orderId = null;

    @JsonProperty("filingNumber")
    @NotNull(message = "filing number is required to create a task")
    private String filingNumber = null;

    @JsonProperty("taskNumber")
    private String taskNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("createdDate")
    @Valid
    private Long createdDate = null;

    @JsonProperty("dateCloseBy")
    @Valid
    private Long dateCloseBy = null;

    @JsonProperty("dateClosed")
    @Valid
    private Long dateClosed = null;

    @JsonProperty("taskDescription")
    private String taskDescription = null;

    @JsonProperty("taskType")
    @NotNull
    private String taskType = null;

    @JsonProperty("taskDetails")
    private TaskDetails taskDetails = null;

    @JsonProperty("amount")
    @Valid
    private Amount amount = null;

    @JsonProperty("status")
    @NotNull
    private String status = null;

    @JsonProperty("assignedTo")
    private List<AssignedTo> assignedTo = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;

    @JsonProperty("postalHub")
    private String postalHub = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = new ArrayList<>();

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("referenceId")
    private String referenceId;

    @JsonProperty("state")
    private String state;

    @JsonProperty("duedate")
    private Long duedate;

}
