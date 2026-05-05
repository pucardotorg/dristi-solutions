package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class PaymentTask {
    @JsonProperty("dueDate")
    private Long dueDate;

    @JsonProperty("daysRemaining")
    private Integer daysRemaining;

    @JsonProperty("task")
    private String task;
}
