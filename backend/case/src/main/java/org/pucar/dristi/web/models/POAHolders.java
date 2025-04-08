package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * POAHolders
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-04-07T16:22:58.728398453+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class POAHolders {

    @JsonProperty("id")
    @Size(min = 2, max = 128)
    private String id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseId")
    @NotNull
    private String caseId = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("poaType")
    @NotNull
    private String poaType = null;

    @JsonProperty("name")
    private String name = null;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = null;

    @JsonProperty("representingLitigants")
    @NotNull
    @NotEmpty(message = "litigants should not be empty")
    private List<Party> representingLitigants;

    @JsonProperty("isActive")
    @NotNull
    private Boolean isActive = true;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;


    public POAHolders addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
