package org.pucar.dristi.web.models;

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

    @NotNull
    @NotEmpty
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("caseId")
    @NotNull
    @NotEmpty
    private String caseId;

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("litigantId")
    private String litigantId;

    @JsonProperty("poaHolderIndividualId")
    private String poaHolderIndividualId;

    @JsonProperty("judgeId")
    private String judgeId;
}
