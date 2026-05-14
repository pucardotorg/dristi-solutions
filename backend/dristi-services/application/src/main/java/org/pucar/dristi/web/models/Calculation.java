package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Calculation
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Calculation {
    @JsonProperty("applicationId")
    private String applicationId = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("totalAmount")
    private Double totalAmount = null;

    @JsonProperty("breakDown")
    private List<BreakDown> breakDown = null;


}
