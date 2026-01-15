package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FilterCriteria {
    @JsonProperty("courtName")
    private String courtName = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("hearingDateFrom")
    @Valid
    private LocalDate hearingDateFrom = null;

    @JsonProperty("hearingDateTo")
    @Valid
    private LocalDate hearingDateTo = null;

    @JsonProperty("caseStatus")
    private String caseStatus = null;

    @JsonProperty("yearOfFiling")
    private String yearOfFiling = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("caseSubStage")
    private String caseSubStage = null;
}
