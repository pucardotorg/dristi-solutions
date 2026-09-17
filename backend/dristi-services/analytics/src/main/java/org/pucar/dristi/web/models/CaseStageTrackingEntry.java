package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseStageTrackingEntry {

    @JsonProperty("stage")
    private String stage;

    @JsonProperty("startTime")
    private Long startTime;

    @JsonProperty("endTime")
    private Long endTime;
}
