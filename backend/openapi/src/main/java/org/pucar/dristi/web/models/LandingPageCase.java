package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandingPageCase {
    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("cmpNumber")
    private String cmpNumber;

    @JsonProperty("stNumber")
    private String stNumber;

    @JsonProperty("purpose")
    private String purpose;

    @JsonProperty("nextHearingDate")
    private String nextHearingDate;
}
