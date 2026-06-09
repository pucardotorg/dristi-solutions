package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import org.springframework.validation.annotation.Validated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Pagination details")
/**
 * Pagination
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Pagination {

    @JsonProperty("limit")

    @DecimalMax("100")
    private Integer limit = 10;

    @JsonProperty("offSet")

    private Integer offSet = 0;

    @JsonProperty("totalCount")

    private Double totalCount = null;

    @JsonProperty("sortBy")

    private String sortBy = null;

    @JsonProperty("order")

    private Order order = null;

}
