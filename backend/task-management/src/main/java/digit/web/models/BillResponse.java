package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * BillResponse
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BillResponse {
    @JsonProperty("ResposneInfo")
    @Valid
    private ResponseInfo resposneInfo = null;

    @JsonProperty("Bill")
    @Valid
    private List<Bill> bill = null;

    public BillResponse addBillItem(Bill billItem) {
        if (this.bill == null) {
            this.bill = new ArrayList<>();
        }
        this.bill.add(billItem);
        return this;
    }
}
