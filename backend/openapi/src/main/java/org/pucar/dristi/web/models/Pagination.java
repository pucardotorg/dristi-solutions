package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * Pagination details
 */
@Schema(description = "Pagination details")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-12-03T13:11:23.212020900+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Pagination {
    @JsonProperty("limit")

    @DecimalMax("100")
    private Double limit = 10d;

    @JsonProperty("offSet")

    private Double offSet = 0d;

    @JsonProperty("totalCount")

    private Double totalCount = null;

    @JsonProperty("sortBy")

    private String sortBy = null;

    @JsonProperty("order")

    private Order order = null;


}
