package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OrderDetails {

    @JsonProperty("date")
    private Long date;

    @JsonProperty("businessOfTheDay")
    private String businessOfTheDay;

    @JsonProperty("orderId")
    private String orderId;

}
