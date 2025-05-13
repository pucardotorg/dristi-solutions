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

    @JsonProperty("outcome")
    private String outcome;

    @JsonProperty("substage")
    private String substage;

    @JsonProperty("cmpNumber")
    private String cmpNumber;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("advocateCount")
    private Integer advocateCount;

    @JsonProperty("status")
    private String status;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("lastModifiedTime")
    private Long lastModifiedTime;
}
