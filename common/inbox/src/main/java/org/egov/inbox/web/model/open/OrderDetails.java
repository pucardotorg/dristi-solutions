package org.egov.inbox.web.model.open;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OrderDetails {

    @JsonProperty("date")
    private Long date;

    @JsonProperty("businessOfDay")
    private String businessOfDay;

}
