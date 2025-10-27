package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * TaskSearchCriteria
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskSearchCriteria {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("courtId")
    @Valid
    private UUID courtId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("workflowStatus")
    private String workflowStatus = null;

    @JsonProperty("businessService")
    private String businessService = null;

    @JsonProperty("workflowCode")
    private String workflowCode = null;

    @JsonProperty("history")
    private Boolean history = false;

    @JsonProperty("taskStatus")
    private List<String> taskStatus = null;

    @JsonProperty("taskType")
    private List<String> taskType = null;

    @JsonProperty("assigneeId")
    @Valid
    private UUID assigneeId = null;

    @JsonProperty("createdFrom")
    private Long createdFrom = null;

    @JsonProperty("createdTo")
    private Long createdTo = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;


    public TaskSearchCriteria addTaskStatusItem(String taskStatusItem) {
        if (this.taskStatus == null) {
            this.taskStatus = new ArrayList<>();
        }
        this.taskStatus.add(taskStatusItem);
        return this;
    }

    public TaskSearchCriteria addTaskTypeItem(String taskTypeItem) {
        if (this.taskType == null) {
            this.taskType = new ArrayList<>();
        }
        this.taskType.add(taskTypeItem);
        return this;
    }

}
