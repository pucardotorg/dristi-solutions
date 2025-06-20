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
public class FilingNumberCriteria {
    @JsonProperty("courtName")
    private String courtName;

    @JsonProperty("code")
    private String code;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("year")
    private String year;
}
