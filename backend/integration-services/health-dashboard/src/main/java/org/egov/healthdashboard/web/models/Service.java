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
public class Service {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("serviceName")
    private String serviceName;

    @JsonProperty("serviceUrl")
    private String serviceUrl;
}