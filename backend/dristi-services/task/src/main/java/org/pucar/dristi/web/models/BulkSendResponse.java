package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import org.egov.common.contract.response.ResponseInfo;

import java.util.List;

@Data
@Builder
public class BulkSendResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("bulkSendTasks")
    @Valid
    private List<BulkSend> bulkSendTasks = null;
}
