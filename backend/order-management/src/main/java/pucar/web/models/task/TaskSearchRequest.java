package pucar.web.models.task;

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
public class TaskSearchRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    private TaskCriteria criteria = null;

    @JsonProperty("pagination")
    private Pagination pagination = null;

}
