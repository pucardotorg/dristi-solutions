package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.Map;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-29T13:38:04.562296+05:30[Asia/Calcutta]")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeliveryChannel {

    @JsonProperty("fees")
    private String fees;

    @JsonProperty("status")
    private String status;

    @JsonProperty("channelCode")
    private String channelCode;

    @JsonProperty("feePaidDate")
    private String feePaidDate;

    @JsonProperty("channelId")
    private String channelId;

    @JsonProperty("taskType")
    private String taskType;

    @JsonProperty("channelDeliveryTime")
    private String channelDeliveryTime;

    @JsonProperty("deliveryChannelName")
    private String deliveryChannelName;

    @JsonProperty("channelName")
    private String channelName;

    @JsonProperty("paymentFees")
    private String paymentFees;

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

    @JsonProperty("isPendingCollection")
    private Boolean isPendingCollection = false;

}