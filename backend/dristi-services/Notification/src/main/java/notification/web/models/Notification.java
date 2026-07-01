package notification.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * An Notification is created as an outcome of an hearing or based on an application. Notification will contain a set of tasks
 */
@Schema(description = "An Notification is created as an outcome of an hearing or based on an application. Notification will contain a set of tasks")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-02-07T11:59:26.022967807+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class    Notification {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseNumber")
    private List<String> caseNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("notificationNumber")
    private String notificationNumber = null;

    @JsonProperty("createdDate")
    private Long createdDate = null;

    @JsonProperty("issuedBy")
    private String issuedBy = null;

    @JsonProperty("notificationType")
    @NotNull
    private String notificationType = null;

    @JsonProperty("notificationDetails")
    private Object notificationDetails = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("comments")
    private String comments = null;

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


    public Notification addCaseNumberItem(String caseNumberItem) {
        if (this.caseNumber == null) {
            this.caseNumber = new ArrayList<>();
        }
        this.caseNumber.add(caseNumberItem);
        return this;
    }

    public Notification addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
