package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @JsonProperty("memberId")
    private String memberId = null;

    @JsonProperty("isMemberActiveInCase")
    private Boolean isMemberActiveInCase = null;
}
