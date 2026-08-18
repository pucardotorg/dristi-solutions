package org.egov.transformer.models.digitalized_document;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.transformer.models.WorkflowObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A digitalized document entity captured during proceedings.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocument {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("type")
    @NotNull(message = "type cannot be null")
    private TypeEnum type = null;

    @JsonProperty("documentNumber")
    private String documentNumber = null;

    @JsonProperty("caseId")
    @NotNull(message = "case id cannot be null")
    private String caseId = null;

    @JsonProperty("caseFilingNumber")
    @NotNull(message = "filing number cannot be null")
    private String caseFilingNumber = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("pleaDetails")
    @Valid
    private PleaDetails pleaDetails = null;

    @JsonProperty("examinationOfAccusedDetails")
    @Valid
    private ExaminationOfAccusedDetails examinationOfAccusedDetails = null;

    @JsonProperty("mediationDetails")
    @Valid
    private MediationDetails mediationDetails = null;

    @JsonProperty("additionalDetails")
    private Map<String, Object> additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("tenantId")
    @Valid
    @NotNull(message = "tenant id cannot be null")
    private String tenantId = null;

    @Valid
    @NotNull(message = "court id cannot be null")
    private String courtId = null;

    @JsonProperty("shortenedUrl")
    private String shortenedUrl = null;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("title")
    private String title;

    @JsonProperty("caseName")
    private String caseName;

    // Enriched for pdf generation
    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("searchableFields")
    private List<String> searchableFields = null;

    @JsonProperty("assignedRoles")
    private List<String> assignedRoles = null;

    @JsonProperty("assignedTo")
    private List<String> assignedTo = null;


    public DigitalizedDocument putAdditionalDetailsItem(String key, Object additionalDetailsItem) {
        if (this.additionalDetails == null) {
            this.additionalDetails = new HashMap<>();
        }
        this.additionalDetails.put(key, additionalDetailsItem);
        return this;
    }

    public DigitalizedDocument addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
