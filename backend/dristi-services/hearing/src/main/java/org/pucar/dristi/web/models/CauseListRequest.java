package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CauseListRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("date")
    private String date;

    @JsonProperty("offset")
    private int offset = 0;

    @JsonProperty("limit")
    private int limit = 100;
}
