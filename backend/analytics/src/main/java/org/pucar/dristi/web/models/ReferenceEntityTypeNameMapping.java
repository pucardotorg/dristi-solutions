package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferenceEntityTypeNameMapping {

    @JsonProperty("referenceEntityType")
    private String referenceEntityType;

    @JsonProperty("pendingTaskName")
    private String pendingTaskName;
}

