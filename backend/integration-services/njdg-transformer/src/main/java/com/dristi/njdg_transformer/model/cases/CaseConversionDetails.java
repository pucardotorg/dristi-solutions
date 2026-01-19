package com.dristi.njdg_transformer.model.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseConversionDetails {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("dateOfConversion")
    private Long dateOfConversion;

    @JsonProperty("convertedFrom")
    private String convertedFrom;

    @JsonProperty("convertedTo")
    private String convertedTo;

    @JsonProperty("preCaseNumber")
    private String preCaseNumber;

    @JsonProperty("postCaseNumber")
    private String postCaseNumber;
}
