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
public class WarrantUpfrontData {

    @JsonProperty("addressId")
    private String addressId;

    @JsonProperty("channelCode")
    private String channelCode;

    @JsonProperty("status")
    private WarrantUpfrontStatus status;
}
