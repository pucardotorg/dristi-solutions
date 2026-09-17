package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.enums.CaseMappingFilterStatus;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMemberSearchCriteria {

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;

    @JsonProperty("officeAdvocateUserUuid")
    @Valid
    @NotNull
    private String officeAdvocateUserUuid;

    @JsonProperty("memberUserUuid")
    @Valid
    @NotNull
    private String memberUserUuid;

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("caseSearchText")
    private String caseSearchText;

    @JsonProperty("caseMappingFilterStatus")
    private CaseMappingFilterStatus caseMappingFilterStatus = null;

}
