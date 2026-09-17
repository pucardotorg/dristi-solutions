package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Data;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;

import java.util.List;

@Data
public class BulkSendRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("bulkSendTasks")
    @Valid
    private List<BulkSend> bulkSendTasks = null;
}
