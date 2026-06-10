package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.egov.common.contract.request.RequestInfo;
import java.util.List;

@Data
public class BulkHearingRequest {
    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("hearings")
    private List<Hearing> hearings;
}
