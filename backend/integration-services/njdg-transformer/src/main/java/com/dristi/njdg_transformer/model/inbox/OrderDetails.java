package com.dristi.njdg_transformer.model.inbox;

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
