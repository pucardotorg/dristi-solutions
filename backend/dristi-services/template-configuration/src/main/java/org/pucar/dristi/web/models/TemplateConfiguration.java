package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:13:43.389623100+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TemplateConfiguration {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("processTitle")
    private String processTitle = null;

    @JsonProperty("processText")
    private String processText = null;

    @JsonProperty("addresseeName")
    private String addresseeName = null;

    @JsonProperty("isCoverLetterRequired")
    @Valid
    private Boolean isCoverLetterRequired = false;

    @JsonProperty("addressee")
    @Valid
    private String addressee  = null;

    @JsonProperty("orderText")
    private String orderText = null;

    @JsonProperty("coverLetterText")
    private String coverLetterText = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

}
