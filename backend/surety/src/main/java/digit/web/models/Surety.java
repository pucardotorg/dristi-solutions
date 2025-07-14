package digit.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * Surety
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:23:09.143185454+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Surety {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("name")
    @NotNull
    private String name = null;

    @JsonProperty("fatherName")
    private String fatherName = null;

    @JsonProperty("caseId")
    @NotNull
    private String caseId = null;

    @JsonProperty("bailId")
    private String bailId = null;

    @JsonProperty("mobileNumber")
    @NotNull
    private String mobileNumber = null;

    @JsonProperty("address")
    private Object address = null;

    @JsonProperty("email")
    private String email = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = false;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails= null;


    public Surety addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
