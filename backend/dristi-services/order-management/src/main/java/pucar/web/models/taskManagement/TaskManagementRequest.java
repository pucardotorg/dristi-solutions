package pucar.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.taskManagement.TaskManagement;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskManagementRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("taskManagement")
    private TaskManagement taskManagement;
}
