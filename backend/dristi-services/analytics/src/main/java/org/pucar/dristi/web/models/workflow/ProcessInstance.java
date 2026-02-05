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
public class ProcessInstance {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("businessService")
    private String businessService;

    @JsonProperty("businessId")
    private String businessId;

    @JsonProperty("action")
    private String action;

    @JsonProperty("moduleName")
    private String moduleName;

    @JsonProperty("comment")
    private String comment;

    @JsonProperty("state")
    private State state;

}
