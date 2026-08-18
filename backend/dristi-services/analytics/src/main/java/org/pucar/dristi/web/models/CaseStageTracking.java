package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseStageTracking {

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("stages")
    @Builder.Default
    private List<CaseStageTrackingEntry> stages = new ArrayList<>();

    @JsonProperty("secondaryStages")
    @Builder.Default
    private List<CaseStageTrackingEntry> secondaryStages = new ArrayList<>();
}
