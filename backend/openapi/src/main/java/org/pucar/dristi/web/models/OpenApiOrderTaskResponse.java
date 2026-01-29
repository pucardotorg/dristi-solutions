package org.pucar.dristi.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class OpenApiOrderTaskResponse {

    @JsonProperty("paymentTasks")
    private List<PaymentTask> paymentTasks = new ArrayList<>();

    @JsonProperty("orderDetailsList")
    private List<OrderDetails> orderDetailsList = new ArrayList<>();

    @JsonProperty("totalCount")
    private Integer totalCount = 0;
}
