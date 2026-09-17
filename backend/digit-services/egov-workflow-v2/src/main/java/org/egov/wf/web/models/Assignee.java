package org.egov.wf.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Assignee {

    @NotNull
    @Size(max = 64)
    @JsonProperty("processInstanceId")
    private String processInstanceId;

    @NotNull
    @Size(max = 128)
    @JsonProperty("tenantId")
    private String tenantId;

    @NotNull
    @Size(max = 128)
    @JsonProperty("assignee")
    private String assignee;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

}
