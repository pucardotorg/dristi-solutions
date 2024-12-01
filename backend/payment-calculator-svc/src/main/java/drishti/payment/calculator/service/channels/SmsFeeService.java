package drishti.payment.calculator.service.channels;


import drishti.payment.calculator.service.Payment;
import drishti.payment.calculator.util.TaskUtil;
import drishti.payment.calculator.web.models.BreakDown;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.TaskPayment;
import drishti.payment.calculator.web.models.TaskPaymentCriteria;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;

import static drishti.payment.calculator.config.ServiceConstants.COURT_FEE;

@Service
@Slf4j
public class SmsFeeService implements Payment {

    private final TaskUtil taskUtil;

    @Autowired
    public SmsFeeService(TaskUtil taskUtil) {
        this.taskUtil = taskUtil;
    }


    @Override
    public Calculation calculatePayment(RequestInfo requestInfo, TaskPaymentCriteria criteria) {
        String taskType = criteria.getTaskType();
        String tenantId = criteria.getTenantId();
        List<TaskPayment> taskPaymentMasterData = taskUtil.getTaskPaymentMasterData(requestInfo, tenantId);
        List<TaskPayment> filteredTaskPayment = taskPaymentMasterData.stream()
                .filter(element -> taskType.equals(element.getType()))
                .toList();

        Double courtFees = taskUtil.calculateCourtFees(filteredTaskPayment.get(0));

        return Calculation.builder()
                .applicationId(criteria.getId())
                .tenantId(criteria.getTenantId())
                .totalAmount(courtFees)
                .breakDown(Collections.singletonList(new BreakDown(COURT_FEE, courtFees, new HashMap<>()))).build();
    }
}
