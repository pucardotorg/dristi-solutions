package pucar.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PendingTaskSearchRequest {


    @JsonProperty("RequestInfo")
    private RequestInfo RequestInfo;

    @JsonProperty("SearchCriteria")
    private IndexSearchCriteria indexSearchCriteria;
}