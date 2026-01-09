package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskDetailsDTO {

    @JsonProperty("id")
    @NotNull(message = "Id is required")
    private String id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("filingNumber")
    @NotNull(message = "Filing number is required")
    private String filingNumber = null;

    @JsonProperty("taskDetails")
    private Object taskDetails = null;

    @JsonProperty("taskNumber")
    @NotNull(message = "Task number is required")
    private String taskNumber = null;

    @JsonProperty("uniqueId")
    @NotNull(message = "Unique ID is required")
    private String uniqueId = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;
}
