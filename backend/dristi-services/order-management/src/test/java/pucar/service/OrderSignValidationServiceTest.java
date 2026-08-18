package pucar.service;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.strategy.validation.OrderSignValidator;
import pucar.util.OrderUtil;
import pucar.web.models.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderSignValidationServiceTest {

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private OrderSignValidator validatorOne;

    @Mock
    private OrderSignValidator validatorTwo;

    private OrdersToSignRequest request(String... orderNumbers) {
        List<OrdersCriteria> criteria = new ArrayList<>();
        for (String orderNumber : orderNumbers) {
            OrdersCriteria criterion = new OrdersCriteria();
            criterion.setOrderNumber(orderNumber);
            criterion.setTenantId("tenant1");
            criteria.add(criterion);
        }
        OrdersToSignRequest request = new OrdersToSignRequest();
        request.setCriteria(criteria);
        request.setRequestInfo(new RequestInfo());
        return request;
    }

    private OrderListResponse orderResponse(String orderNumber) {
        Order order = Order.builder().orderNumber(orderNumber).tenantId("tenant1").build();
        return OrderListResponse.builder().responseInfo(new ResponseInfo())
                .list(new ArrayList<>(Collections.singletonList(order))).build();
    }

    private OrderSignValidationService service() {
        return new OrderSignValidationService(orderUtil, Arrays.asList(validatorOne, validatorTwo));
    }

    @Test
    void fetchesEachOrderOnceAndRunsEveryValidator() {
        when(orderUtil.getOrders(any())).thenReturn(orderResponse("ORD1"), orderResponse("ORD2"));

        service().validate(request("ORD1", "ORD2"));

        ArgumentCaptor<List<Order>> captor = ArgumentCaptor.forClass(List.class);
        verify(validatorOne).validate(any(RequestInfo.class), captor.capture());
        verify(validatorTwo).validate(any(RequestInfo.class), eq(captor.getValue()));

        List<Order> orders = captor.getValue();
        assertEquals(2, orders.size());
        assertEquals("ORD1", orders.get(0).getOrderNumber());
        assertEquals("ORD2", orders.get(1).getOrderNumber());
    }

    @Test
    void skipsCriteriaWithNoMatchingOrder() {
        OrderListResponse empty = OrderListResponse.builder().responseInfo(new ResponseInfo()).list(new ArrayList<>()).build();
        when(orderUtil.getOrders(any())).thenReturn(empty, orderResponse("ORD2"));

        service().validate(request("ORD1", "ORD2"));

        ArgumentCaptor<List<Order>> captor = ArgumentCaptor.forClass(List.class);
        verify(validatorOne).validate(any(RequestInfo.class), captor.capture());

        List<Order> orders = captor.getValue();
        assertEquals(1, orders.size());
        assertEquals("ORD2", orders.get(0).getOrderNumber());
    }
}
