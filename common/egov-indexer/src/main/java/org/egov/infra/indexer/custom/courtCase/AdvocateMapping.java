package org.egov.infra.indexer.custom.courtCase;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-19T15:42:53.131831400+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class AdvocateMapping {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("tenantId")
    //  @NotNull
    private String tenantId = null;

    @JsonProperty("advocateId")
    private String advocateId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("representing")
    @Valid
    // @Size(min=1)
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