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
public class FilingNumberCriteria {
    @JsonProperty("courtName")
    private String courtName = null;

    @JsonProperty("code")
    private String code = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("year")
    private String year = null;
}
