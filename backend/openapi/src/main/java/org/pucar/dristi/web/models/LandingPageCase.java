package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandingPageCase {
    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("stNumber")
    private String stNumber = null;

    @JsonProperty("purpose")
    private String purpose = null;

    @JsonProperty("nextHearingDate")
    private Long nextHearingDate = null;

    @JsonProperty("lastHearingDate")
    private Long lastHearingDate = null;

    @JsonProperty("filingDate")
    private Long filingDate = null;

    @JsonProperty("registrationDate")
    private Long registrationDate = null;

    @JsonProperty("advocate")
    private List<PartyInfo> advocate = null;

    @JsonProperty("litigant")
    private List<PartyInfo> litigant = null;
}
