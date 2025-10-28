package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * TaxAndPayment
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaxAndPayment {

    @JsonProperty("businessService")
    private String businessService = null;

    @JsonProperty("taxAmount")
    private String taxAmount = null;

    @JsonProperty("amountPaid")
    private String amountPaid = null;
}
