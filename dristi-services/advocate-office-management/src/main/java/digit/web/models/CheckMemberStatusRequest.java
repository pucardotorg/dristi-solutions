package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CheckMemberStatusRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("advocateUserUuid")
    @NotNull
    @Valid
    private String advocateUserUuid;

    @JsonProperty("memberUserUuid")
    @NotNull
    @Valid
    private String memberUserUuid;

    @JsonProperty("tenantId")
    @Valid
    private String tenantId;
}
