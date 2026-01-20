package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import pucar.web.models.WorkflowObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
    @NotNull (message = "filing number is required to create a task")
    private String filingNumber = null;

    @JsonProperty("taskNumber")
    private String taskNumber = null;

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
    private Object taskDetails = null;

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


    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("courtId")
    private String courtId;


    public Task addDocumentsItem(Document documentsItem) {
        this.documents.add(documentsItem);
        return this;
    }

}
