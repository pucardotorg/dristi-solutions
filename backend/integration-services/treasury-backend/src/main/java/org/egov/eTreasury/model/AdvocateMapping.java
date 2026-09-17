package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateMapping {

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
    private List<Party> representing = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = false;


}
