package pucar.web.models.hearing;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("hearing")
    @Valid
    private Hearing hearing = new Hearing();
}
