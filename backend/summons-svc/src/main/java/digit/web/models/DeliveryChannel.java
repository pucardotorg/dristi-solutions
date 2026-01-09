package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.util.Map;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-29T13:38:04.562296+05:30[Asia/Calcutta]")
@Data
@Builder
public class DeliveryChannel {

    @JsonProperty("fees")
    private String fees;

    @JsonProperty("status")
    private String status;

    @JsonProperty("channelCode")
    private String channelCode;

    @JsonProperty("feePaidDate")
    private String feePaidDate;

    @JsonProperty("statusChangeDate")
    private String statusChangeDate;

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

    @JsonProperty("channelAcknowledgementId")
    private String channelAcknowledgementId;

    @JsonProperty("isPendingCollection")
    private Boolean isPendingCollection = false;

}