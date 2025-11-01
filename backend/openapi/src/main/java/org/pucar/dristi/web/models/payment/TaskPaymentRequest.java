package org.pucar.dristi.web.models.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskPaymentRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("Criteria")
    @Valid
    private List<TaskPaymentCriteria> calculationCriteria = null;


    public TaskPaymentRequest addCalculationCriteriaItem(TaskPaymentCriteria calculationCriteriaItem) {
        if (this.calculationCriteria == null) {
            this.calculationCriteria = new ArrayList<>();
        }
        this.calculationCriteria.add(calculationCriteriaItem);
        return this;
    }
}
