package com.egov.icops_integrationkerala.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class RescheduleProcessRequest {

    @JsonProperty("processUniqueId")
    private String processUniqueId;

    @JsonProperty("processNextHearingDate")
    private String processNextHearingDate;

    @JsonProperty("processDoc")
    private String processDoc;

    @JsonProperty("remarks")
    private String remarks;
}
