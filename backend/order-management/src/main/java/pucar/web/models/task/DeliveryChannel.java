package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;

import java.util.Map;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-29T13:38:04.562296+05:30[Asia/Calcutta]")
@Data
@Builder
public class DeliveryChannel {

    @JsonProperty("channelName")
    private String channelName;

    @JsonProperty("channelCode")
    private String channelCode;

    @JsonProperty("fees")
    private Double fees;

    @JsonProperty("paymentTransactionId")
    private String paymentTransactionId;

    @JsonProperty("paymentStatus")
    private String paymentStatus;

    @JsonProperty("deliveryStatus")
    private String deliveryStatus;

    @JsonProperty("deliveryStatusChangedDate")
    private String deliveryStatusChangedDate;

    @JsonProperty("channelDetails")
    private Map<String, String> channelDetails;

    @JsonProperty("feesStatus")
    private String feesStatus;
}