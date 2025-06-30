package org.egov.transformer.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.models.Workflow;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Advocate {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    @Size(min = 2, max = 128)
    private String tenantId = null;

    @JsonProperty("applicationNumber")
    @Size(min = 2, max = 64)
    private String applicationNumber = null;

    @JsonProperty("status")
    private String status=null;

    @JsonProperty("barRegistrationNumber")
    @Size(min = 2, max = 64)
    private String barRegistrationNumber = null;

    @JsonProperty("advocateType")
    @Size(min = 2, max = 64)
    private String advocateType = null;

    @JsonProperty("organisationID")
    @Valid
    private UUID organisationID = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("workflow")
    @Valid
    private Workflow workflow = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = new ArrayList<>();

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("accused")
    private List<String> accused = null;

    @JsonProperty("complainant")
    private List<String> complainant = null;

    @JsonProperty("individualIds")
    private List<String> individualIds = null;

}
