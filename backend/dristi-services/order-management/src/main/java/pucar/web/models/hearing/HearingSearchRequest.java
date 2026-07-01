package pucar.web.models.hearing;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.Pagination;

@Getter
@Setter
@Builder
public class HearingSearchRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("criteria")
    @Valid
    private HearingCriteria criteria;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;

}
