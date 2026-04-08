package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class CaseSearchTextItem {

    @JsonProperty("cmpNumber")
    private String cmpNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("caseTitle")
    private String caseTitle;

}
