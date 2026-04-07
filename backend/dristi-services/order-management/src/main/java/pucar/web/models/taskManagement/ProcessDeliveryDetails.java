package pucar.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProcessDeliveryDetails {

    @JsonProperty("addressId")
    private String addressId;

    @JsonProperty("channelCode")
    private String channelCode;

    @JsonProperty("processDeliveryDetailsStatus")
    private ProcessDeliveryDetailsStatus processDeliveryDetailsStatus;
}
