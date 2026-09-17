package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import pucar.web.models.Pagination;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskListResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("TotalCount")
    private Integer totalCount = null;

    @JsonProperty("list")
    @Valid
    private List<Task> list = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;


}
