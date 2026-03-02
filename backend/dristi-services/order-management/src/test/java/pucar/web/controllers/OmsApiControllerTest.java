package pucar.web.controllers;

import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import pucar.service.BSSService;
import pucar.web.models.*;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OmsApiControllerTest {

    @Mock
    private BSSService bssService;

    @InjectMocks
    private OmsApiController omsApiController;

    private OrdersToSignRequest ordersToSignRequest;
    private UpdateSignedOrderRequest updateSignedOrderRequest;

    @BeforeEach
    void setUp() {
        ordersToSignRequest = new OrdersToSignRequest();
        ordersToSignRequest.setRequestInfo(new RequestInfo()); // Mock request info

        updateSignedOrderRequest = new UpdateSignedOrderRequest();
    }

    @Test
    void testGetOrdersToSign_Success() {
        // Mock response
        List<OrderToSign> mockOrderList = Collections.singletonList(new OrderToSign());
        when(bssService.createOrderToSignRequest(ordersToSignRequest)).thenReturn(mockOrderList);

        // Execute method
        ResponseEntity<OrdersToSignResponse> response = omsApiController.getOrdersToSign(ordersToSignRequest);

        // Assertions
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(mockOrderList, response.getBody().getOrderList());

        verify(bssService, times(1)).createOrderToSignRequest(ordersToSignRequest);
    }

    @Test
    void testGetOrdersToSign_Exception() {
        when(bssService.createOrderToSignRequest(ordersToSignRequest)).thenThrow(new RuntimeException("Service failure"));

        // Verify exception handling
        assertThrows(RuntimeException.class, () -> omsApiController.getOrdersToSign(ordersToSignRequest));

        verify(bssService, times(1)).createOrderToSignRequest(ordersToSignRequest);
    }

    @Test
    void testUpdateSignedOrders_Success() {
        // Execute method
        ResponseEntity<UpdateSignedOrderResponse> response = omsApiController.updateSignedOrders(updateSignedOrderRequest);

        // Assertions
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());

        verify(bssService, times(1)).updateOrderWithSignDoc(updateSignedOrderRequest);
    }

    @Test
    void testUpdateSignedOrders_Exception() {
        doThrow(new RuntimeException("Service failure")).when(bssService).updateOrderWithSignDoc(updateSignedOrderRequest);

        assertThrows(RuntimeException.class, () -> omsApiController.updateSignedOrders(updateSignedOrderRequest));

        verify(bssService, times(1)).updateOrderWithSignDoc(updateSignedOrderRequest);
    }
}
