package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.models.Workflow;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Notification {

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
}
