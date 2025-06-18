package org.egov.inbox.web.model.open;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;


@Data
public class OpenInboxRequest {

    @JsonProperty("isOrder")
    private Boolean forOrders = false;

    @JsonProperty("forPaymentTask")
    private Boolean forPaymentTask = false;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    private Integer limit;
}
