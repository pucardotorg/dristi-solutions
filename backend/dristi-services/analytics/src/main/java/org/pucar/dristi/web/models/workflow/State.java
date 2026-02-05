package org.pucar.dristi.web.models.workflow;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class State {

    @JsonProperty("uuid")
    private String uuid;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("businessServiceId")
    private String businessServiceId;

    @JsonProperty("sla")
    private Long sla;

    @JsonProperty("state")
    private String state;

    @JsonProperty("applicationStatus")
    private String applicationStatus;

    @JsonProperty("docUploadRequired")
    private Boolean docUploadRequired;

    @JsonProperty("isStartState")
    private Boolean isStartState;

    @JsonProperty("isTerminateState")
    private Boolean isTerminateState;

    @JsonProperty("isStateUpdatable")
    private Boolean isStateUpdatable;
}
