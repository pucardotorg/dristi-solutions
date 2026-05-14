package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * SignedOrder
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-03-11T12:54:13.550043793+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SignedOrder {

    @JsonProperty("orderNumber")
    @NotNull
    private String orderNumber = null;

    @JsonProperty("signedOrderData")
    @NotNull
    private String signedOrderData = null;

    @JsonProperty("signed")
    @NotNull
    private Boolean signed = true;

    @JsonProperty("errorMsg")
    private String errorMsg = null;

    @JsonProperty("tenantId")
    private String tenantId;


}
