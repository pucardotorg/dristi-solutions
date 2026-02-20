package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkPendingCollectionUpdate {

    @JsonProperty("tenantId")
    @NotNull(message = "tenantId is required")
    private String tenantId;

    @JsonProperty("taskNumber")
    @NotNull(message = "taskNumber is required")
    private String taskNumber;

    @JsonProperty("isSuccess")
    private boolean isSuccess = true;

    @JsonProperty("errorMessage")
    private String errorMessage;
}
