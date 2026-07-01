package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import digit.web.models.enums.CaseMappingFilterStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMemberSearchCriteria {

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("officeAdvocateUserUuid")
    @Valid
    @NotNull
    private UUID officeAdvocateUserUuid = null;

    @JsonProperty("memberUserUuid")
    @Valid
    @NotNull
    private UUID memberUserUuid = null;

    @JsonProperty("advocateId")
    @NotNull
    @Valid
    private String advocateId = null;


    @JsonProperty("caseSearchText")
    private String caseSearchText = null;

    @JsonProperty("caseMappingFilterStatus")
    private CaseMappingFilterStatus caseMappingFilterStatus = null;
}
