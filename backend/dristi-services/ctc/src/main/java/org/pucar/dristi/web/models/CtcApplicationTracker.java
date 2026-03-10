package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CtcApplicationTracker {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("status")
    private String status;

    @JsonProperty("dateRaised")
    private Long dateRaised;

    @JsonProperty("applicantName")
    private String applicantName;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("searchableFields")
    private List<String> searchableFields;
}
