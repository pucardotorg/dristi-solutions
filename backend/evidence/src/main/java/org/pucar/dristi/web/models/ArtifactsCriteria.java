package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Validated
public class ArtifactsCriteria {
    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("placeholder")
    private String placeholder;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("artifactNumber")
    private String artifactNumber;
}
