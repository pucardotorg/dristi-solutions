package org.pucar.dristi.web.models.task_management;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskSearchCriteria {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("courtId")
    @Valid
    private String courtId = null;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

    @JsonProperty("taskManagementNumber")
    private String taskManagementNumber;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("taskType")
    private List<String> taskType = null;

}
