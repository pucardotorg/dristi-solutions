package org.pucar.dristi.web.models.payment;

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
public class CalculationRes {
    @JsonProperty("ResponseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("Calculation")
    @Valid
    private List<Calculation> calculation = null;


    public CalculationRes addCalculationItem(Calculation calculationItem) {
        if (this.calculation == null) {
            this.calculation = new ArrayList<>();
        }
        this.calculation.add(calculationItem);
        return this;
    }

}
