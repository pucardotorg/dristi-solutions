package org.pucar.dristi.web.models.task_management;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;

import java.util.ArrayList;
import java.util.List;

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
