package drishti.payment.calculator.service.channels;


import drishti.payment.calculator.helper.TaskPaymentTestBuilder;
import drishti.payment.calculator.util.TaskUtil;
import drishti.payment.calculator.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static drishti.payment.calculator.config.ServiceConstants.COURT_FEE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PoliceFeeServiceTest {

    @Mock
    private TaskUtil taskUtil;

    @InjectMocks
    private PoliceFeeService policeSummonFeeService;

    @Test
    @DisplayName("do calculate police summon fee")
    public void doCalculatePoliceSummonFee() {

        TaskPayment payment = TaskPaymentTestBuilder.builder().withConfig("SUMMON").build();

        Double courtFee = 100.0;
        when(taskUtil.getTaskPaymentMasterData(any(), anyString())).thenReturn(Collections.singletonList(payment));

        when(taskUtil.calculateCourtFees(any(TaskPayment.class))).thenReturn(courtFee);
        TaskPaymentCriteria criteria = new TaskPaymentCriteria();
        criteria.setTenantId("pb");
        criteria.setTaskType("SUMMON");

        Calculation result = policeSummonFeeService.calculatePayment(new RequestInfo(), criteria);

        assertEquals(courtFee, result.getTotalAmount());
        assertEquals(1, result.getBreakDown().size());
        BreakDown breakDown = result.getBreakDown().get(0);
        assertEquals(COURT_FEE, breakDown.getType());
        assertEquals(courtFee, breakDown.getAmount());

    }
}
