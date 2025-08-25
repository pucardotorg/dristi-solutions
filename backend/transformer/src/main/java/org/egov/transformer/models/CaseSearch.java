package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseSearch {
    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("filingNumber")
    @NotBlank
    private String filingNumber = null;

    @JsonProperty("courtName")
    private String courtName = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("tenantId")
    @NotBlank
    private String tenantId = null;

    @JsonProperty("stNumber")
    private String stNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("advocates")
    private List<Participant> advocates = null;

    @JsonProperty("litigants")
    private List<Participant> litigants = null;

    @JsonProperty("nextHearingDate")
    private Long nextHearingDate = null;

    @JsonProperty("caseStage")
    private String caseStage = null;

    @JsonProperty("caseStatus")
    private String caseStatus = null;

    @JsonProperty("yearOfFiling")
    private String yearOfFiling = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("lastHearingDate")
    private Long lastHearingDate;

    @JsonProperty("filingDate")
    private Long filingDate;

    @JsonProperty("registrationDate")
    private Long registrationDate;

    @JsonProperty("caseSubStage")
    private String caseSubStage = null;

    @JsonProperty("outcome")
    private String outcome = null;
}
