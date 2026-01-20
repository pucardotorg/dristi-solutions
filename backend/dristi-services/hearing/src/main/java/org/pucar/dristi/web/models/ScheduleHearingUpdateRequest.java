package org.pucar.dristi.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleHearingUpdateRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("Hearing")
    @Valid
    private List<ScheduleHearing> scheduleHearings;

}
