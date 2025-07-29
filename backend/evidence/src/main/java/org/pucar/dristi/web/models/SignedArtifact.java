package org.pucar.dristi.web.models;

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
public class SignedArtifact {
    @JsonProperty("artifactId")
    @NotNull
    private String artifactId;

    @JsonProperty("signedArtifactData")
    @NotNull
    private String signedArtifactData;

    @JsonProperty("isWitnessDeposition")
    private Boolean isWitnessDeposition;

    @JsonProperty("signed")
    @NotNull
    private Boolean signed;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("errorMsg")
    private String errorMsg;
}
