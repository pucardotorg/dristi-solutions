package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailUpdateRequest {

    @JsonProperty("bailUuid")
    private String bailUuid = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;
}

