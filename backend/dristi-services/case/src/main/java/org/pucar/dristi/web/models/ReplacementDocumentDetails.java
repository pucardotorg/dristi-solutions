package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReplacementDocumentDetails {
    @NotNull
    @JsonProperty("fileStore")
    private String fileStore;

    @NotNull
    @JsonProperty("additionalDetails")
    private Object additionalDetails;

    @NotNull
    @JsonProperty("documentType")
    private String documentType;

}
