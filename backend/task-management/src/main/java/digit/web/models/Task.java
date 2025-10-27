package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * A task is created as part of an Order. It will always be linked to an order
 */
@Schema(description = "A task is created as part of an Order. It will always be linked to an order")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
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
    @NotNull

    @Valid
    private UUID orderId = null;

    @JsonProperty("taskNumber")

    private String taskNumber = null;

    @JsonProperty("filingNumber")

    private String filingNumber = null;

    @JsonProperty("cnrNumber")

    private String cnrNumber = null;

    @JsonProperty("createdDate")
    @NotNull

    private Long createdDate = null;

    @JsonProperty("dateCloseBy")

    private Long dateCloseBy = null;

    @JsonProperty("dateClosed")

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

    @Valid
    private AssignedTo assignedTo = null;

    @JsonProperty("isActive")

    private Boolean isActive = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditDetails")

    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")

    @Valid
    private Workflow workflow = null;

    @JsonProperty("referenceId")

    private String referenceId = null;

    @JsonProperty("state")

    private String state = null;

    @JsonProperty("duedate")

    private Long duedate = null;


    public Task addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
