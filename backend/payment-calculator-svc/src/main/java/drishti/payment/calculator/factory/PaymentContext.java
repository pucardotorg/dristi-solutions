package drishti.payment.calculator.factory;

import drishti.payment.calculator.service.Payment;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.TaskPaymentCriteria;
import lombok.AllArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;


@Setter
@AllArgsConstructor
public class PaymentContext {

    private Payment payment;

    public Calculation calculatePayment(RequestInfo requestInfo, TaskPaymentCriteria criteria) {
        return payment.calculatePayment(requestInfo, criteria);
    }
}
