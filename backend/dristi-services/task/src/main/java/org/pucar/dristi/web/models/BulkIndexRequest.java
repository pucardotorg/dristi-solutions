package org.pucar.dristi.web.models;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@Schema(description = "Request for bulk indexing tasks to Elasticsearch")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkIndexRequest {

    private RequestInfo requestInfo;

    private String courtId;

    private Integer batchSize;

}
