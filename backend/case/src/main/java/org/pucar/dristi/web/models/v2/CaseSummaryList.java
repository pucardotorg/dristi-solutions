package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseSummaryList {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("filingDate")
    private Long filingDate;

    @JsonProperty("stage")
    private String stage;

    @JsonProperty("caseType")
    private String caseType;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;
}
