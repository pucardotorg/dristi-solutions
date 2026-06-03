package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.response.ResponseInfo;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentHearingResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("sessionStatus")
    private String sessionStatus;

    @JsonProperty("currentHearingKey")
    private String currentHearingKey;

    @JsonProperty("hearingData")
    private Map<String, Object> hearingData;
}
