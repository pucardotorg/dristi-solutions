package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LandingPageFileRequest {

    @JsonProperty("fileStoreId")
    @Valid
    @NotNull
    private String fileStoreId;

    @JsonProperty("tenantId")
    @Valid
    private String tenantId;

    @JsonProperty("moduleName")
    @Valid
    @NotNull
    private String moduleName;
}
