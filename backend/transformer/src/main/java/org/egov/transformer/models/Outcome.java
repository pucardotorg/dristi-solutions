package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;


@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Outcome {

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("outcome")
    private String outcome = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

}
