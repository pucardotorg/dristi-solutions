package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Application
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:12:15.132164900+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Application {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseId")
    @NotNull
    private String caseId = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("referenceId")
    @Valid
    private UUID referenceId = null;

    @JsonProperty("createdDate")
    @NotNull
    private Long createdDate = null;

    @JsonProperty("createdBy")
    @Valid
    private UUID createdBy = null;

    @JsonProperty("onBehalfOf")
    @Valid
    private List<UUID> onBehalfOf = null;

    @JsonProperty("applicationCMPNumber")
    private String applicationCMPNumber = null;

    @JsonProperty("applicationType")
    @NotNull
    @Valid
    private String applicationType = null;

    @JsonProperty("applicationNumber")
    @Size(min = 2, max = 48)
    private String applicationNumber = null;

    @JsonProperty("issuedBy")
    private IssuedBy issuedBy = null;

    @JsonProperty("status")
    @NotNull
    private String status = null;

    @JsonProperty("comment")
    private List<Comment> comment = new ArrayList<>();

    @JsonProperty("isActive")
    @NotNull
    private Boolean isActive = null;

    @JsonProperty("reasonForApplication")
    private String reasonForApplication = null;

    @JsonProperty("applicationDetails")
    private Object applicationDetails = null;

    @JsonProperty("statuteSection")
    @Valid
    private StatuteSection statuteSection = null;

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
    private WorkflowObject workflow = null;


    public boolean isResponseRequired() {
        if (additionalDetails instanceof Map) {
            Map<String, Object> detailsMap = (Map<String, Object>) additionalDetails;
            if (detailsMap.containsKey("isResponseRequired")) {
                return (boolean) detailsMap.get("isResponseRequired");
            }
        }
        return false;
    }
}
