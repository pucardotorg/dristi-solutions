package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentHearingRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @NotBlank
    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("currentHearingNumber")
    private String currentHearingNumber;
}
