package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * amount in form of fees or penalty
 */
@Schema(description = "amount in form of fees or penalty")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Amount {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("amount")
    @NotNull

    private String amount = null;

    @JsonProperty("type")
    @NotNull

    private String type = null;

    @JsonProperty("paymentRefNumber")

    private String paymentRefNumber = null;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("status")
    private String status;
}
