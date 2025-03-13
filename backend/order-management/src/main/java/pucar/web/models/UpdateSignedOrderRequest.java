package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * UpdateSignedOrderRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-03-11T12:54:13.550043793+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSignedOrderRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("signedOrders")
    @Valid
    private List<SignedOrder> signedOrders = null;


    public UpdateSignedOrderRequest addSignedOrdersItem(SignedOrder signedOrdersItem) {
        if (this.signedOrders == null) {
            this.signedOrders = new ArrayList<>();
        }
        this.signedOrders.add(signedOrdersItem);
        return this;
    }

}
