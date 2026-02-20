package org.pucar.dristi.web.models.bailbond;

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
public class OpenApiUpdateBailBondRequest {

    @JsonProperty("tenantId")
    @NotNull(message = "tenantId is required")
    private String tenantId;

    @JsonProperty("bailId")
    @NotNull(message = "bailId is required")
    private String bailId;

    @JsonProperty("mobileNumber")
    @NotNull(message = "mobileNumber is required")
    private String mobileNumber;

    @JsonProperty("fileStoreId")
    @NotNull(message = "fileStoreId is required")
    private String fileStoreId;

}
