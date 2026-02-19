package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMemberInfo {

    @JsonProperty("caseId")
    private UUID caseId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("cmpNumber")
    private String cmpNumber;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("isActive")
    private Boolean isActive;

}
