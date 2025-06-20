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
public class CaseNumberCriteria {
    @JsonProperty("courtName")
    private String courtName;

    @JsonProperty("caseType")
    private String caseType;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("year")
    private String year;
}
