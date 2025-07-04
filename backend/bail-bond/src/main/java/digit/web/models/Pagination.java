package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;


@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
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
