package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FilterCriteria {
    @JsonProperty("courtName")
    private String courtName;

    @JsonProperty("caseType")
    private String caseType;

    @JsonProperty("hearingDateFrom")
    @Valid
    private LocalDate hearingDateFrom;

    @JsonProperty("hearingDateTo")
    @Valid
    private LocalDate hearingDateTo;

    @JsonProperty("caseStage")
    private String caseStage;

    @JsonProperty("caseStatus")
    private String caseStatus;

    @JsonProperty("yearOfFiling")
    private String yearOfFiling;
}
