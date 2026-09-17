package org.pucar.dristi.web.models.ctcApplication;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class CtcApplication {

    @JsonProperty("id")
    @Valid
    private String id;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("tenantId")
    @NotNull
    @Valid
    private String tenantId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails;
}
