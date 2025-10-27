package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSearchCriteria {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("courtId")
    private UUID courtId;

    @JsonProperty("orderNumber")
    private String orderNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("workflowStatus")
    private String workflowStatus;

    @JsonProperty("businessService")
    private String businessService;

    @JsonProperty("workflowCode")
    private String workflowCode;

    @JsonProperty("history")
    private Boolean history = false;

    @JsonProperty("taskStatus")
    private List<String> taskStatus;

    @JsonProperty("taskType")
    private List<String> taskType;

    @JsonProperty("assigneeId")
    private UUID assigneeId;

    @JsonProperty("createdFrom")
    private Long createdFrom;

    @JsonProperty("createdTo")
    private Long createdTo;

    @JsonProperty("isActive")
    private Boolean isActive;
}
