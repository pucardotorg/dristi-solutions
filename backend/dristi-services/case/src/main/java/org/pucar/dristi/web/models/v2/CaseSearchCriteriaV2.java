package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class CaseSearchCriteriaV2 {

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("litigantId")
    private String litigantId;

    @JsonProperty("poaHolderIndividualId")
    private String poaHolderIndividualId;

    @JsonProperty("judgeId")
    private String judgeId;

    @JsonProperty("officeAdvocateId")
    private String officeAdvocateId = null;

    @JsonProperty("isClerk")
    private Boolean isClerk = null;

    @JsonProperty("casesFor")
    private CasesFor casesFor;

    @JsonProperty("secondaryStage")
    private List<String> secondaryStage = null;
}
