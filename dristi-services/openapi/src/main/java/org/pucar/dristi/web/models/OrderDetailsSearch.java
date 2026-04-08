package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OrderDetailsSearch {

    @JsonProperty("referenceId")
    private String referenceId;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("orderNumber")
    private String orderNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("orderItemId")
    private String orderItemId;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

}
