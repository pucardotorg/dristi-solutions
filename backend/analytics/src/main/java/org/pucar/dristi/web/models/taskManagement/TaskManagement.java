package org.pucar.dristi.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * TaskManagement
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskManagement {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber = null;

    @JsonProperty("courtId")
    @Valid
    private String courtId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("taskType")
    @Valid
    @NotNull
    private String taskType = null;

    @JsonProperty("taskManagementNumber")
    private String taskManagementNumber = null;

    @JsonProperty("tenantId")
    @NotNull
    @Valid
    private String tenantId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("partyDetails")
    private List<PartyDetails> partyDetails;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

}
