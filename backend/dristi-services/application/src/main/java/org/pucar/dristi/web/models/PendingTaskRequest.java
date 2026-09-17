package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

@Schema(description = "Request wrapper for creating/closing a pending task")
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PendingTaskRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("pendingTask")
    @Valid
    private PendingTask pendingTask = new PendingTask();

}
