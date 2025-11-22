package org.pucar.dristi.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * A task is created as part of an Order. It will always be linked to an order
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:50.003326400+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PartyDetails {

    @JsonProperty("respondentDetails")
    private Object respondentDetails;

    @JsonProperty("witnessDetails")
    private Object witnessDetails;

    @JsonProperty("addresses")
    private List<PartyAddress> addresses;

    @JsonProperty("deliveryChannels")
    private List<DeliveryChannel> deliveryChannels;

    @JsonProperty("status")
    private UpFrontStatus status;

}
