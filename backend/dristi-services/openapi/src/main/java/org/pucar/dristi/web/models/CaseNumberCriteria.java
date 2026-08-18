package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
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
    private String courtName = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("year")
    private String year = null;
}
