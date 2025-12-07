package org.pucar.dristi.web.models.digital_document;

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
public class OpenApiDigitalDocumentSearchRequest {

    @JsonProperty("tenantId")
    @NotNull(message = "tenantId is required")
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("documentNumber")
    @NotNull(message = "documentNumber is required")
    private String documentNumber;

    @JsonProperty("mobileNumber")
    @NotNull(message = "mobileNumber is required")
    private String mobileNumber;

}