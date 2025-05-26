package pucar.web.models.calculator;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskPaymentCriteria {

    @JsonProperty("channelId")
    private String channelId;

    @JsonProperty("receiverPincode")
    private String receiverPincode;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("taskType")
    private String taskType;

    @JsonProperty("id")
    private String id;
}
