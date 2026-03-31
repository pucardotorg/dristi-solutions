package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Schema(description = "Response for bulk indexing tasks to Elasticsearch")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkIndexResponse {

    @Schema(description = "Response information")
    private ResponseInfo responseInfo;

    @Schema(description = "Total number of tasks processed")
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

    @Schema(description = "Status of the bulk indexing operation")
    private String status;

    @Schema(description = "Job ID for tracking async operations")
    private String jobId;
}
