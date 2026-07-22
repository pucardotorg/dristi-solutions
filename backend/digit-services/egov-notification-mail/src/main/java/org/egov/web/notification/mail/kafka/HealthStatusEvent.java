package org.egov.web.notification.mail.kafka;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mirrors the field names of health-dashboard's ServiceHealthStatus so the
 * JSON payload can be read straight into that model on the consumer side.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HealthStatusEvent {

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