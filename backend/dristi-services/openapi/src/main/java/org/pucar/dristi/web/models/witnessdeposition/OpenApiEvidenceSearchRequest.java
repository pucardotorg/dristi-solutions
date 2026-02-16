package org.pucar.dristi.web.models.witnessdeposition;

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
public class OpenApiEvidenceSearchRequest {

    @JsonProperty("tenantId")
    @NotNull(message = "tenantId is required")
    private String tenantId;

    @JsonProperty("artifactNumber")
    @NotNull(message = "artifactNumber is required")
    private String artifactNumber;

    @JsonProperty("mobileNumber")
    @NotNull(message = "mobileNumber is required")
    private String mobileNumber;

}