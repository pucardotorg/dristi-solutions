package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A digitalized document entity captured during proceedings.
 */
@Schema(description = "A digitalized document entity captured during proceedings.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocument {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("type")
    private TypeEnum type = null;

    @JsonProperty("documentNumber")
    private String documentNumber = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("caseFilingNumber")
    private String caseFilingNumber = null;

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
    private String tenantId = null;


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
