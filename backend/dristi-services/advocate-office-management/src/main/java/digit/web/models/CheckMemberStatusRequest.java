package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private RequestInfo requestInfo;

    @JsonProperty("advocateUserUuid")
    @NotNull
    private String advocateUserUuid;

    @JsonProperty("memberUserUuid")
    @NotNull
    private String memberUserUuid;
}
