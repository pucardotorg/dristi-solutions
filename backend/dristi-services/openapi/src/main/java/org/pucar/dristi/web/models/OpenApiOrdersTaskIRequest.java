package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NonNull;


@Data
public class OpenApiOrdersTaskIRequest {

    @JsonProperty("forOrders")
    private Boolean forOrders = false;

    @JsonProperty("forPaymentTask")
    private Boolean forPaymentTask = false;

    @JsonProperty("filingNumber")
    @NonNull
    private String filingNumber;

    @JsonProperty("tenantId")
    @NonNull
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("latestOrder")
    private Boolean latestOrder=false;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    private Integer limit;
}
