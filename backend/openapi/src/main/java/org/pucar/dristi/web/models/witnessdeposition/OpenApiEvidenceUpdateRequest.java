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
public class OpenApiEvidenceUpdateRequest {

    @JsonProperty("tenantId")
    @NotNull(message = "tenantId is required")
    private String tenantId;

    @JsonProperty("artifactNumber")
    @NotNull(message = "artifactNumber is required")
    private String artifactNumber;

    @JsonProperty("partyType")
    @NotNull(message = "partyType is required")
    private String partyType;

    @JsonProperty("mobileNumber")
    @NotNull(message = "mobileNumber is required")
    private String mobileNumber;

    @JsonProperty("fileStoreId")
    @NotNull(message = "fileStoreId is required")
    private String fileStoreId;

}
