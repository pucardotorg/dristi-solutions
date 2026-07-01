package org.pucar.dristi.web.models.courtcase;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Party {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    //@NotNull

    private String tenantId = null;

    @JsonProperty("caseId")

    private String caseId = null;

    @JsonProperty("partyCategory")
    //@NotNull

    private String partyCategory = null;

    @JsonProperty("organisationID")

    private String organisationID = null;

    @JsonProperty("individualId")

    private String individualId = null;

    @JsonProperty("partyType")

    private String partyType = null;

    @JsonProperty("isActive")

    private Boolean isActive = true;

    @JsonProperty("isResponseRequired")

    private Boolean isResponseRequired = false;

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
