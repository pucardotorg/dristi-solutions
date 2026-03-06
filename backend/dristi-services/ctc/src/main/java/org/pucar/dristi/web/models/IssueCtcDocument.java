package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueCtcDocument {

    @JsonProperty("id")
    private String id;

    @JsonProperty("docId")
    private String docId;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("createdTime")
    private Long createdTime;

    @JsonProperty("lastModifiedTime")
    private Long lastModifiedTime;

    @JsonProperty("docTitle")
    private String docTitle;

    @JsonProperty("status")
    private String status;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("caseNumber")
    private String caseNumber;
}
