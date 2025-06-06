package org.egov.infra.indexer.custom.application;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-16T15:17:16.225735+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Comment {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("individualId")
    @NotNull

    private String individualId = null;

    @JsonProperty("comment")
    @NotNull

    @Size(min = 2, max = 2048)
    private String comment = null;

    @JsonProperty("isActive")

    private Boolean isActive = true;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditdetails")

    @Valid
    private AuditDetails auditdetails = null;

}
