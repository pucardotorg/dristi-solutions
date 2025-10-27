package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:50.003326400+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DeliveryChannel {

    @JsonProperty("fees")
    private Integer fees;

    @JsonProperty("status")
    private String status;

    @JsonProperty("feesStatus")
    private String feesStatus;

    @JsonProperty("channelCode")
    private String channelCode;

    @JsonProperty("channelName")
    private String channelName;

    @JsonProperty("feePaidDate")
    private String feePaidDate;

    @JsonProperty("statusChangeDate")
    private String statusChangeDate;

}
