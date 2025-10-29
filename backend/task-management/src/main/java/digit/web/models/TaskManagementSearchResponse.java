package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * TaskManagementSearchResponse
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskManagementSearchResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("taskManagementRecords")
    @Valid
    private List<TaskManagement> taskManagementRecords = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

    @JsonProperty("totalCount")
    private Integer totalCount = null;


    public TaskManagementSearchResponse addTaskManagementRecordsItem(TaskManagement taskManagementRecordsItem) {
        if (this.taskManagementRecords == null) {
            this.taskManagementRecords = new ArrayList<>();
        }
        this.taskManagementRecords.add(taskManagementRecordsItem);
        return this;
    }

}
