package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;


@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseOverallStatus {

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("stage")
    private String stage = null;

    @JsonProperty("substage")
    private String substage = null;

    @JsonProperty("secondaryStage")
    private List<String> secondaryStage = new ArrayList<>();

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

}
