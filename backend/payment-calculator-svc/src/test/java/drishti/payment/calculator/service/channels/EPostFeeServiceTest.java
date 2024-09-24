package drishti.payment.calculator.service.channels;


import drishti.payment.calculator.config.Configuration;
import drishti.payment.calculator.helper.SpeedPostConfigParamsTestBuilder;
import drishti.payment.calculator.helper.TaskPaymentTestBuilder;
import drishti.payment.calculator.repository.PostalHubRepository;
import drishti.payment.calculator.util.SpeedPostUtil;
import drishti.payment.calculator.util.TaskUtil;
import drishti.payment.calculator.web.models.*;
import drishti.payment.calculator.web.models.enums.Classification;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EPostFeeServiceTest {

    @Mock
    private TaskUtil taskUtil;

    @Mock
    private PostalHubRepository repository;

    @Mock
    private SpeedPostUtil speedPostUtil;

    @Mock
    private Configuration config;

    @InjectMocks
    private EPostFeeService ePostSummonFeeService;


    @Test
    @DisplayName("do calculate e-post summon fee")
    public void doCalculateEPostSummonFee() {
        TaskPayment payment = TaskPaymentTestBuilder.builder().withConfig("SUMMON").build();

        SpeedPostConfigParams configParams = SpeedPostConfigParamsTestBuilder.builder().withSpeedPost().withConfig().build();
        when(taskUtil.getTaskPaymentMasterData(any(), anyString())).thenReturn(Collections.singletonList(payment));

        when(repository.getPostalHub(any())).thenReturn(Collections.singletonList(PostalHub.builder().classification(Classification.LTD).build()));
        when(taskUtil.getIPostFeesDefaultData(any(), anyString())).thenReturn(configParams);
        Double courtFee = 100.0;
        when(taskUtil.calculateCourtFees(any(TaskPayment.class))).thenReturn(courtFee);
        when(config.getNumberOfPgOfSummon()).thenReturn(2);
        TaskPaymentCriteria criteria = new TaskPaymentCriteria();
        criteria.setTenantId("pb");
        criteria.setTaskType("SUMMON");

        Calculation result = ePostSummonFeeService.calculatePayment(new RequestInfo(), criteria);

        assertEquals(courtFee, result.getTotalAmount());

    }


}
