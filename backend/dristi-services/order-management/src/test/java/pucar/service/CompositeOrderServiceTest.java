package pucar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.util.CaseUtil;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.courtCase.WitnessDetails;
import pucar.web.models.courtCase.WitnessDetailsRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompositeOrderServiceTest {

    @Mock
    private OrderStrategyExecutor orderStrategyExecutor;

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private  ApplicationValidationService applicationValidationService;

    private CompositeOrderService compositeOrderService;

    private Order order;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        compositeOrderService = new CompositeOrderService(objectMapper, orderStrategyExecutor, orderUtil, caseUtil, applicationValidationService);

        requestInfo = new RequestInfo();

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("E-SIGN");

        order = Order.builder()
                .orderNumber("ORD1")
                .tenantId("kl")
                .filingNumber("FILING1")
                .workflow(workflow)
                .compositeItems(List.of(compositeItem("item1", "ADDING_WITNESSES"), compositeItem("item2", "NOTICE")))
                .build();
    }

    private Map<String, Object> compositeItem(String id, String orderType) {
        Map<String, Object> orderSchema = new HashMap<>();
        orderSchema.put("additionalDetails", new HashMap<>());
        orderSchema.put("orderDetails", new HashMap<>());

        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("orderType", orderType);
        item.put("orderSchema", orderSchema);
        return item;
    }

    private WitnessDetails witness(String uniqueId) {
        WitnessDetails details = new WitnessDetails();
        details.setUniqueId(uniqueId);
        return details;
    }

    @Test
    void postProcessOrder_witnessesAccumulatedAcrossCompositeItems_flushedInSingleCall() {
        doAnswer(invocation -> {
            OrderRequest req = invocation.getArgument(0);
            req.getWitnessAccumulator().add(witness("W-" + req.getOrder().getOrderType()));
            return null;
        }).when(orderStrategyExecutor).afterPublish(any());

        OrderRequest orderRequest = OrderRequest.builder().order(order).requestInfo(requestInfo).build();

        compositeOrderService.postProcessOrder(orderRequest);

        verify(orderStrategyExecutor, times(2)).afterPublish(any());

        ArgumentCaptor<WitnessDetailsRequest> captor = ArgumentCaptor.forClass(WitnessDetailsRequest.class);
        verify(caseUtil, times(1)).addWitnessToCase(captor.capture());

        WitnessDetailsRequest flushed = captor.getValue();
        assertEquals("FILING1", flushed.getCaseFilingNumber());
        assertEquals("kl", flushed.getTenantId());
        assertEquals(2, flushed.getWitnessDetails().size());
    }

    @Test
    void postProcessOrder_sameAccumulatorInstancePassedToEachCompositeItem() {
        ArgumentCaptor<OrderRequest> captor = ArgumentCaptor.forClass(OrderRequest.class);
        doNothing().when(orderStrategyExecutor).afterPublish(captor.capture());

        OrderRequest orderRequest = OrderRequest.builder().order(order).requestInfo(requestInfo).build();
        compositeOrderService.postProcessOrder(orderRequest);

        List<OrderRequest> capturedRequests = captor.getAllValues();
        assertEquals(2, capturedRequests.size());
        assertNotNull(capturedRequests.get(0).getWitnessAccumulator());
        assertSame(capturedRequests.get(0).getWitnessAccumulator(), capturedRequests.get(1).getWitnessAccumulator());
    }

    @Test
    void postProcessOrder_noWitnessesAccumulated_doesNotCallCaseUtil() {
        doNothing().when(orderStrategyExecutor).afterPublish(any());

        OrderRequest orderRequest = OrderRequest.builder().order(order).requestInfo(requestInfo).build();
        compositeOrderService.postProcessOrder(orderRequest);

        verify(caseUtil, never()).addWitnessToCase(any());
    }
}