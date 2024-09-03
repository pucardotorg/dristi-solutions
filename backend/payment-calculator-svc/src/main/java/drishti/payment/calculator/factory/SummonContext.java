package drishti.payment.calculator.factory;

import drishti.payment.calculator.service.SummonPayment;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.SummonCalculationCriteria;
import lombok.AllArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;


@Setter
@AllArgsConstructor
public class SummonContext {

    private SummonPayment payment;

    public Calculation calculatePayment(RequestInfo requestInfo, SummonCalculationCriteria criteria) {
       return payment.calculatePayment(requestInfo,criteria);
    }
}
