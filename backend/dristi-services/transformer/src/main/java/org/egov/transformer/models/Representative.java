package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Representative{

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("advocateId")
    private String advocateId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("representing")
    @Valid
    @NotEmpty
    private List<Representing> representing = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("documents")
    @Valid
    @NotEmpty
    private List<Document> documents = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = false;
}
