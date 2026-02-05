package org.pucar.dristi.web.models.workflow;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AssigneeSearchCriteria {

    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @NotNull
    @JsonProperty("uuids")
    private List<String> uuids;

    @JsonProperty("excludeUuids")
    private List<String> excludeUuids;

    @JsonProperty("businessId")
    private String businessId;

}
