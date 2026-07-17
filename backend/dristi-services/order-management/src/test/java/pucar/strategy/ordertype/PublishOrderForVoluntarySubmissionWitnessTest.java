package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.util.ApplicationUtil;
import pucar.util.CaseUtil;
import pucar.util.JsonUtil;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.application.Application;
import pucar.web.models.courtCase.WitnessDetails;
import pucar.web.models.courtCase.WitnessDetailsRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublishOrderForVoluntarySubmissionWitnessTest {

    @Mock
    private ApplicationUtil applicationUtil;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private OrderUtil orderUtil;

    private JsonUtil jsonUtil;
    private ObjectMapper mapper;

    private PublishOrderForVoluntarySubmissionWitness strategy;

    private Order order;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        jsonUtil = new JsonUtil();
        mapper = new ObjectMapper();
        strategy = new PublishOrderForVoluntarySubmissionWitness(applicationUtil, caseUtil, jsonUtil, mapper, orderUtil);

        requestInfo = new RequestInfo();

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("E-SIGN");

        order = Order.builder()
                .orderNumber("ORD1")
                .orderType("APPROVE_VOLUNTARY_SUBMISSIONS")
                .tenantId("kl")
                .filingNumber("FILING1")
                .workflow(workflow)
                .build();
    }

    private Application witnessApplication(String filingNumber, String tenantId, List<Map<String, Object>> witnessEntries) {
        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("witnessDetails", witnessEntries);

        return Application.builder()
                .applicationNumber("APP1")
                .applicationType("ADDING_WITNESSES")
                .filingNumber(filingNumber)
                .tenantId(tenantId)
                .additionalDetails(additionalDetails)
                .build();
    }

    private Map<String, Object> witnessEntry(String uniqueId, String firstName) {
        Map<String, Object> data = new HashMap<>();
        data.put("firstName", firstName);

        Map<String, Object> entry = new HashMap<>();
        entry.put("uniqueId", uniqueId);
        entry.put("data", data);
        return entry;
    }

    @Test
    void postProcess_compositeBatchMode_accumulatesWitnessesInsteadOfCallingCaseUtil() {
        Application application = witnessApplication("FILING1", "kl",
                List.of(witnessEntry("W1", "John"), witnessEntry("W2", "Jane")));
        when(orderUtil.getReferenceId(order)).thenReturn("APP1");
        when(applicationUtil.searchApplications(any())).thenReturn(List.of(application));

        List<WitnessDetails> accumulator = new ArrayList<>();
        OrderRequest orderRequest = OrderRequest.builder()
                .order(order)
                .requestInfo(requestInfo)
                .witnessAccumulator(accumulator)
                .build();

        strategy.postProcess(orderRequest);

        assertEquals(2, accumulator.size());
        assertEquals("W1", accumulator.get(0).getUniqueId());
        assertEquals("John", accumulator.get(0).getFirstName());
        assertEquals("W2", accumulator.get(1).getUniqueId());
        verify(caseUtil, never()).addWitnessToCase(any());
    }

    @Test
    void postProcess_nonCompositeMode_callsCaseUtilImmediately() {
        Application application = witnessApplication("FILING1", "kl", List.of(witnessEntry("W1", "John")));
        when(orderUtil.getReferenceId(order)).thenReturn("APP1");
        when(applicationUtil.searchApplications(any())).thenReturn(List.of(application));

        OrderRequest orderRequest = OrderRequest.builder()
                .order(order)
                .requestInfo(requestInfo)
                .build();

        strategy.postProcess(orderRequest);

        ArgumentCaptor<WitnessDetailsRequest> captor = ArgumentCaptor.forClass(WitnessDetailsRequest.class);
        verify(caseUtil, times(1)).addWitnessToCase(captor.capture());
        WitnessDetailsRequest captured = captor.getValue();
        assertEquals("FILING1", captured.getCaseFilingNumber());
        assertEquals("kl", captured.getTenantId());
        assertEquals(1, captured.getWitnessDetails().size());
        assertEquals("W1", captured.getWitnessDetails().get(0).getUniqueId());
    }

    @Test
    void postProcess_nonWitnessApplication_isIgnoredInBothModes() {
        Application nonWitnessApplication = Application.builder()
                .applicationNumber("APP1")
                .applicationType("SOME_OTHER_TYPE")
                .filingNumber("FILING1")
                .tenantId("kl")
                .build();
        when(orderUtil.getReferenceId(order)).thenReturn("APP1");
        when(applicationUtil.searchApplications(any())).thenReturn(List.of(nonWitnessApplication));

        List<WitnessDetails> accumulator = new ArrayList<>();
        OrderRequest orderRequest = OrderRequest.builder()
                .order(order)
                .requestInfo(requestInfo)
                .witnessAccumulator(accumulator)
                .build();

        strategy.postProcess(orderRequest);

        assertTrue(accumulator.isEmpty());
        verify(caseUtil, never()).addWitnessToCase(any());
    }

    @Test
    void postProcess_compositeBatchMode_missingAdditionalDetails_doesNotFailAndAddsNothing() {
        Application application = Application.builder()
                .applicationNumber("APP1")
                .applicationType("ADDING_WITNESSES")
                .filingNumber("FILING1")
                .tenantId("kl")
                .additionalDetails(null)
                .build();
        when(orderUtil.getReferenceId(order)).thenReturn("APP1");
        when(applicationUtil.searchApplications(any())).thenReturn(List.of(application));

        List<WitnessDetails> accumulator = new ArrayList<>();
        OrderRequest orderRequest = OrderRequest.builder()
                .order(order)
                .requestInfo(requestInfo)
                .witnessAccumulator(accumulator)
                .build();

        assertDoesNotThrow(() -> strategy.postProcess(orderRequest));
        assertTrue(accumulator.isEmpty());
        verify(caseUtil, never()).addWitnessToCase(any());
    }

    @Test
    void postProcess_nonCompositeMode_caseUtilFailure_wrapsInCustomException() {
        Application application = witnessApplication("FILING1", "kl", List.of(witnessEntry("W1", "John")));
        when(orderUtil.getReferenceId(order)).thenReturn("APP1");
        when(applicationUtil.searchApplications(any())).thenReturn(List.of(application));
        doThrow(new RuntimeException("downstream failure")).when(caseUtil).addWitnessToCase(any());

        OrderRequest orderRequest = OrderRequest.builder()
                .order(order)
                .requestInfo(requestInfo)
                .build();

        CustomException exception = assertThrows(CustomException.class, () -> strategy.postProcess(orderRequest));
        assertEquals("ERROR_ADDING_WITNESS", exception.getCode());
    }

    @Test
    void supportsPostProcessing_trueOnlyForApprovedVoluntarySubmissionWithESign() {
        assertTrue(strategy.supportsPostProcessing(OrderRequest.builder().order(order).build()));

        Order wrongType = Order.builder()
                .orderType("SOME_OTHER_ORDER")
                .workflow(order.getWorkflow())
                .build();
        assertFalse(strategy.supportsPostProcessing(OrderRequest.builder().order(wrongType).build()));

        WorkflowObject otherAction = new WorkflowObject();
        otherAction.setAction("REJECT");
        Order wrongAction = Order.builder()
                .orderType("APPROVE_VOLUNTARY_SUBMISSIONS")
                .workflow(otherAction)
                .build();
        assertFalse(strategy.supportsPostProcessing(OrderRequest.builder().order(wrongAction).build()));
    }

    @Test
    void createWitnessDetails_convertsRawObjectIntoWitnessDetailsList() {
        List<Map<String, Object>> rawWitnessDetails = List.of(witnessEntry("W1", "John"), witnessEntry("W2", "Jane"));

        List<WitnessDetails> result = strategy.createWitnessDetails(rawWitnessDetails);

        assertEquals(2, result.size());
        assertEquals("W1", result.get(0).getUniqueId());
        assertEquals("John", result.get(0).getFirstName());
        assertEquals("W2", result.get(1).getUniqueId());
        assertEquals("Jane", result.get(1).getFirstName());
    }
}