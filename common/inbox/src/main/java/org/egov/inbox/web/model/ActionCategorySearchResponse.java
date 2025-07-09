package org.egov.inbox.web.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.inbox.web.model.V2.Data;

import java.util.HashMap;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ActionCategorySearchResponse {

    @JsonProperty("reviewProcessData")
    private Criteria reviewProcessData;

    @JsonProperty("viewApplicationData")
    private Criteria viewApplicationData;

    @JsonProperty("scheduleHearingData")
    private Criteria scheduleHearingData;

    @JsonProperty("registerCasesData")
    private Criteria registerCasesData;

    @JsonProperty("bailBondData")
    private Criteria bailBondData;

}
