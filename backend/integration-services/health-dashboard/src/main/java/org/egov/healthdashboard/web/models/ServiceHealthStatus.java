package org.egov.healthdashboard.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ServiceHealthStatus {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("serviceName")
    private String serviceName;

    @JsonProperty("serviceUrl")
    private String serviceUrl;

    @JsonProperty("lastStatus")
    private String lastStatus;

    @JsonProperty("lastUpdatedTime")
    private Long lastUpdatedTime;

    @JsonProperty("responseTimeMs")
    private Long responseTimeMs;

    @JsonProperty("message")
    private String message;
}