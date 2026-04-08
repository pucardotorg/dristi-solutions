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
public class SampleEntitySearchRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("criteria")
    @NotNull
    @Valid
    private SampleEntitySearchCriteria criteria;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;
}
