package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class TaskCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("orderId")
    private UUID orderId = null;

    @JsonProperty("taskNumber")
    private String taskNumber = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("referenceId")
    private String referenceId;

    @JsonProperty("state")
    private String state;


}
