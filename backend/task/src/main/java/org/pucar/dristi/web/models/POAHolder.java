package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class POAHolder {

    @JsonProperty("id")
    @Size(min = 2, max = 128)
    private String id;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;

    @JsonProperty("caseId")
    @NotNull
    private String caseId;

    @JsonProperty("individualId")
    private String individualId;

    @JsonProperty("poaType")
    @NotNull
    private String poaType;

    @JsonProperty("name")
    private String name;

    @JsonProperty("isActive")
    @NotNull
    private Boolean isActive = true;

    @JsonProperty("documents")
    private List<Document> documents;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

    @JsonProperty("additionalDetails")
    private Object additionalDetails;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = false;

    @JsonProperty("representingLitigants")
    @NotNull
    @NotEmpty(message = "representing litigants should not be empty")
    private List<PoaParty> representingLitigants   ;  // store this as json b , create new class
}