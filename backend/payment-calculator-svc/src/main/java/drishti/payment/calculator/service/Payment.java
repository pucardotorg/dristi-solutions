package drishti.payment.calculator.service;

import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.TaskPaymentCriteria;
import org.egov.common.contract.request.RequestInfo;

public interface Payment {

    Calculation calculatePayment(RequestInfo requestInfo, TaskPaymentCriteria criteria);

}
