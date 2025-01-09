package drishti.payment.calculator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import drishti.payment.calculator.helper.EFilingParamTestBuilder;
import drishti.payment.calculator.util.CaseUtil;
import drishti.payment.calculator.util.EFillingUtil;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.EFilingParam;
import drishti.payment.calculator.web.models.EFillingCalculationCriteria;
import drishti.payment.calculator.web.models.EFillingCalculationReq;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CaseFeeCalculationServiceTest {

    @InjectMocks
    private CaseFeeCalculationService caseFeesCalculationService;

    @Mock
    private EFillingUtil eFillingUtil;

    @Mock
    private CaseUtil caseUtil;

    @Test
    @DisplayName("do calculate case fees")
    public void doCalculateCaseFees() {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode mockJsonNode = objectMapper.createObjectNode().put("advocateCount", 0);
        EFilingParam eFilingParam = EFilingParamTestBuilder.builder().withConfig().withPetitionFee().withAdvocateFee().build();
        when(eFillingUtil.getEFillingDefaultData(any(), anyString())).thenReturn(eFilingParam);
        when(caseUtil.searchCaseDetails(any())).thenReturn(mockJsonNode);
        EFillingCalculationReq request = EFillingCalculationReq.builder()
                .calculationCriteria(Collections.singletonList(
                        EFillingCalculationCriteria.builder().tenantId("pb").numberOfApplication(1).checkAmount(50000.0).isDelayCondonation(false).build()
                )).build();

        List<Calculation> result = caseFeesCalculationService.calculateCaseFees(request);
        assertEquals(request.getCalculationCriteria().size(), result.size());
        Calculation firstCalculation = result.get(0);
        assertEquals(5, firstCalculation.getBreakDown().size());

    }

}
