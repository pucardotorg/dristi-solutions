package org.pucar.dristi.web.models.ctcApplication;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
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
public class CtcApplicationSearchCriteria {

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;
}
