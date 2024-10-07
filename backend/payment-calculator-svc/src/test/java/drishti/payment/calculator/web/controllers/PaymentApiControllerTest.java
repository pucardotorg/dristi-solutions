package drishti.payment.calculator.web.controllers;

import drishti.payment.calculator.service.CaseFeeCalculationService;
import drishti.payment.calculator.service.PaymentCalculationService;
import drishti.payment.calculator.util.ResponseInfoFactory;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.CalculationRes;
import drishti.payment.calculator.web.models.EFillingCalculationReq;
import drishti.payment.calculator.web.models.TaskPaymentRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PaymentApiControllerTest {

    @Mock
    private PaymentCalculationService paymentCalculationService;

    @Mock
    private CaseFeeCalculationService calculationService;

    @InjectMocks
    private PaymentApiController paymentApiController;

    private List<Calculation> calculations;
    private CalculationRes calculationRes;
    private EFillingCalculationReq calculationReq;


    private TaskPaymentRequest taskPaymentRequest;

    @BeforeEach
    void setUp() {
        // Initialize the test data
        calculationReq = new EFillingCalculationReq();
        calculationReq.setRequestInfo(new RequestInfo());

        taskPaymentRequest= new TaskPaymentRequest();
        taskPaymentRequest.setRequestInfo(new RequestInfo());

        Calculation calculation = new Calculation();
        calculations = Collections.singletonList(calculation);

        ResponseInfo responseInfo = new ResponseInfo();
        calculationRes = CalculationRes.builder()
                .responseInfo(responseInfo)
                .calculation(calculations)
                .build();
    }


    @Test
    void caseFeesCalculation_success() {
        when(calculationService.calculateCaseFees(calculationReq)).thenReturn(calculations);
        ResponseEntity<CalculationRes> responseEntity = paymentApiController.caseFeesCalculation(calculationReq);

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(responseEntity.getBody().getCalculation()).isEqualTo(calculationRes.getCalculation());
        verify(calculationService).calculateCaseFees(calculationReq);
    }

    @Test
    void caseFeesCalculation_serviceFailure() {
        when(calculationService.calculateCaseFees(calculationReq)).thenThrow(new RuntimeException("Service failure"));

        assertThatThrownBy(() -> paymentApiController.caseFeesCalculation(calculationReq))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Service failure");

        verify(calculationService).calculateCaseFees(calculationReq);
    }

    @Test
    public void testCalculateTaskPayment() throws Exception {

        when(paymentCalculationService.calculateTaskPaymentFees(taskPaymentRequest)).thenReturn(calculations);
        ResponseEntity<CalculationRes> response = paymentApiController.calculateTaskPayment(taskPaymentRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(calculationRes.getCalculation(), response.getBody().getCalculation());
        verify(paymentCalculationService).calculateTaskPaymentFees(taskPaymentRequest);

    }

}
