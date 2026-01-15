package pucar.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSignedOrderResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("orders")
    @Valid
    private List<Order> orders = null;


    public UpdateSignedOrderResponse addOrderListItem(Order orderListItem) {
        if (this.orders == null) {
            this.orders = new ArrayList<>();
        }
        this.orders.add(orderListItem);
        return this;
    }
}
