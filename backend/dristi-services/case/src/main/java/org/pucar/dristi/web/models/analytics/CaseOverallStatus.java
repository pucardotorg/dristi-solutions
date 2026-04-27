package org.pucar.dristi.web.models.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.ProcessHandler;
import org.pucar.dristi.web.models.enums.LifecycleStatus;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;


@Schema(description = "Case overall status topic object")
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

    @JsonProperty("lifecycleStatus")
    private LifecycleStatus lifecycleStatus;

    @JsonProperty("processHandler")
    private ProcessHandler processHandler = ProcessHandler.RESET_BACKUP;

    @JsonProperty("secondaryStage")
    private List<String> secondaryStage = new ArrayList<>();

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    public CaseOverallStatus(String filingNumber, String tenantId, String stage) {
        this.filingNumber = filingNumber;
        this.tenantId = tenantId;
        this.stage = stage;
    }

}
