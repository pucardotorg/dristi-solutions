package drishti.payment.calculator.service;

import drishti.payment.calculator.factory.PaymentFactory;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.TaskPaymentCriteria;
import drishti.payment.calculator.web.models.TaskPaymentRequest;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentCalculationServiceTest {

    @Mock
    private PaymentFactory paymentFactory;

    @InjectMocks
    private PaymentCalculationService paymentCalculationService;

    @Mock
    private Payment payment;

    private TaskPaymentRequest taskPaymentRequest;
    private RequestInfo requestInfo;
    private List<TaskPaymentCriteria> calculationCriteria;
    private TaskPaymentCriteria criteria;

    @BeforeEach
    void setUp() {
        requestInfo = new RequestInfo();
        criteria = TaskPaymentCriteria.builder().channelId("channel1").build();
        calculationCriteria = Collections.singletonList(criteria);

        taskPaymentRequest = TaskPaymentRequest.builder()
                .requestInfo(requestInfo)
                .calculationCriteria(calculationCriteria)
                .build();
    }

    @Test
    @DisplayName("calculate task payment fees for channel id")
    void doCalculateTaskPaymentFees() {
        when(paymentFactory.getChannelById(anyString())).thenReturn(payment);

        List<Calculation> calculations = paymentCalculationService.calculateTaskPaymentFees(taskPaymentRequest);

        assertNotNull(calculations);
        assertEquals(1, calculations.size());

        verify(paymentFactory, times(1)).getChannelById(anyString());
    }
}
