package org.pucar.dristi.web.models;


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

<<<<<<<< HEAD:backend/hearing/src/main/java/org/pucar/dristi/web/models/CaseSearchRequest.java
/**
 * CaseSearchRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
========
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-09-24T14:05:42.847785340+05:30[Asia/Kolkata]")
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/TaskPaymentRequest.java
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
<<<<<<<< HEAD:backend/hearing/src/main/java/org/pucar/dristi/web/models/CaseSearchRequest.java
public class CaseSearchRequest {
========
public class TaskPaymentRequest {
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/TaskPaymentRequest.java

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

<<<<<<<< HEAD:backend/hearing/src/main/java/org/pucar/dristi/web/models/CaseSearchRequest.java
    @JsonProperty("criteria")
    @Valid
    private List<CaseCriteria> criteria = new ArrayList<>();

    public CaseSearchRequest addCriteriaItem(CaseCriteria criteriaItem) {
        this.criteria.add(criteriaItem);
========
    @JsonProperty("Criteria")
    @Valid
    private List<TaskPaymentCriteria> calculationCriteria = null;


    public TaskPaymentRequest addCalculationCriteriaItem(TaskPaymentCriteria calculationCriteriaItem) {
        if (this.calculationCriteria == null) {
            this.calculationCriteria = new ArrayList<>();
        }
        this.calculationCriteria.add(calculationCriteriaItem);
>>>>>>>> dpg-qa-deployment:backend/payment-calculator-svc/src/main/java/drishti/payment/calculator/web/models/TaskPaymentRequest.java
        return this;
    }

}
