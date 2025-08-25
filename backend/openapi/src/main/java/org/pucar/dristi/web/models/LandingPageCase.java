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

    @JsonProperty("advocates")
    private List<PartyInfo> advocates = null;

    @JsonProperty("litigants")
    private List<PartyInfo> litigants = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("courtName")
    private String courtName = null;

    @JsonProperty("caseStage")
    private String caseStage = null;

    @JsonProperty("caseStatus")
    private String caseStatus = null;

    @JsonProperty("caseSubStage")
    private String caseSubStage = null;

    @JsonProperty("outcome")
    private String outcome = null;
}
