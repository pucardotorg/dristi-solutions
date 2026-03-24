package org.pucar.dristi.web.models;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Schema(description = "Response for bulk indexing job status")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkIndexStatusResponse {

    @Schema(description = "Response information")
    private ResponseInfo responseInfo;

    @Schema(description = "Job ID")
    private String jobId;

    @Schema(description = "Status of the job: STARTED, IN_PROGRESS, SUCCESS, PARTIAL_SUCCESS, FAILED, NO_TASKS_FOUND")
    private String status;

    @Schema(description = "Total number of tasks to process (may be -1 if still counting)")
    private Long totalTasks;

    @Schema(description = "Number of successfully indexed tasks")
    private Long successCount;

    @Schema(description = "Number of failed tasks")
    private Long failureCount;

    @Schema(description = "Number of batches processed")
    private Integer batchesProcessed;

    @Schema(description = "Processing time in milliseconds")
    private Long processingTimeMs;

    @Schema(description = "Error message if any")
    private String errorMessage;

    @Schema(description = "Percentage complete")
    private Double percentageComplete;
}
