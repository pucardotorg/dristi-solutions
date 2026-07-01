package org.pucar.dristi.web.models.bailbond;

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
public class OpenApiSurety {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("index")
    @NotNull
    private Integer index = null;

    @JsonProperty("name")
    @NotNull
    private String name = null;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = null;

    @JsonProperty("phoneNumber")
    private String phoneNumber = null;


}
