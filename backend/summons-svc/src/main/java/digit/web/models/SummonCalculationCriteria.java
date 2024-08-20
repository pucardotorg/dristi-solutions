package digit.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class SummonCalculationCriteria {

    @JsonProperty("channelId")
    private String channelId;

    @JsonProperty("receiverPincode")
    private String receiverPincode;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("summonId")
    private String summonId;


}
