package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

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

    @JsonProperty("channelId")
    private String channelId;

    @JsonProperty("taskType")
    private String taskType;

    @JsonProperty("channelDeliveryTime")
    private String channelDeliveryTime;

    @JsonProperty("isPendingCollection")
    private Boolean isPendingCollection;

}
