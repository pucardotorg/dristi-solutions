package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static pucar.config.ServiceConstants.*;

@ExtendWith(MockitoExtension.class)
class OrderUtilTest {

    @Mock
    private Configuration configuration;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @InjectMocks
    private OrderUtil orderUtil;

    @Test
    void testFetchOrderDetails_Exception() {
        when(configuration.getOrderHost()).thenReturn("http://order-service");
        when(configuration.getOrderExistsEndPoint()).thenReturn("/order/exists");

        OrderExistsRequest request = new OrderExistsRequest();
        String url = "http://order-service/order/exists";

        when(serviceRequestRepository.fetchResult(new StringBuilder(url), request)).thenThrow(new RuntimeException("Service error"));

        assertThrows(CustomException.class, () -> orderUtil.fetchOrderDetails(request));
    }

    private static final List<String> ORDER_TYPES_REQUIRING_REF_APPLICATION = List.of(
            SET_BAIL_TERMS, RESCHEDULE_OF_HEARING_DATE, CHECKOUT_ACCEPTANCE,
            ASSIGNING_DATE_RESCHEDULED_HEARING, INITIATING_RESCHEDULING_OF_HEARING_DATE,APPROVE_VOLUNTARY_SUBMISSIONS);

    private Order buildOrder(String orderType, String action, String refApplicationId) {
        WorkflowObject workflow = null;
        if (action != null) {
            workflow = new WorkflowObject();
            workflow.setAction(action);
        }

        Object additionalDetails = null;
        if (refApplicationId != null) {
            Map<String, Object> formdata = new HashMap<>();
            formdata.put("refApplicationId", refApplicationId);
            Map<String, Object> details = new HashMap<>();
            details.put("formdata", formdata);
            additionalDetails = details;
        }

        return Order.builder()
                .orderType(orderType)
                .workflow(workflow)
                .additionalDetails(additionalDetails)
                .build();
    }

    @Test
    void testValidateRefApplicationId_ValidRefApplicationId_DoesNotThrowForEachRequiredOrderType() {
        for (String orderType : ORDER_TYPES_REQUIRING_REF_APPLICATION) {
            Order order = buildOrder(orderType, E_SIGN, "APP-123");
            assertDoesNotThrow(() -> orderUtil.validateRefApplicationId(order),
                    "Did not expect exception for order type: " + orderType);
        }
    }

    @Test
    void testValidateRefApplicationId_MissingRefApplicationId_ThrowsForEachRequiredOrderType() {
        for (String orderType : ORDER_TYPES_REQUIRING_REF_APPLICATION) {
            Order order = buildOrder(orderType, E_SIGN, null);
            CustomException exception = assertThrows(CustomException.class,
                    () -> orderUtil.validateRefApplicationId(order),
                    "Expected exception for order type: " + orderType);
            assertTrue(exception.getMessage().contains(orderType));
        }
    }

    @Test
    void testValidateRefApplicationId_BlankRefApplicationId_Throws() {
        Order order = buildOrder(SET_BAIL_TERMS, E_SIGN, "   ");

        CustomException exception = assertThrows(CustomException.class,
                () -> orderUtil.validateRefApplicationId(order));
        assertEquals("REF_APPLICATION_ID_NOT_FOUND", exception.getCode());
        assertTrue(exception.getMessage().contains(SET_BAIL_TERMS));
    }

    @Test
    void testValidateRefApplicationId_NullAdditionalDetails_Throws() {
        Order order = buildOrder(SET_BAIL_TERMS, E_SIGN, null);

        CustomException exception = assertThrows(CustomException.class,
                () -> orderUtil.validateRefApplicationId(order));
        assertEquals("REF_APPLICATION_ID_NOT_FOUND", exception.getCode());
    }

    @Test
    void testValidateRefApplicationId_NonEsignAction_DoesNotThrow() {
        Order order = buildOrder(SET_BAIL_TERMS, "SAVE_DRAFT", null);

        assertDoesNotThrow(() -> orderUtil.validateRefApplicationId(order));
    }

    @Test
    void testValidateRefApplicationId_NullWorkflow_DoesNotThrow() {
        Order order = buildOrder(SET_BAIL_TERMS, null, null);

        assertDoesNotThrow(() -> orderUtil.validateRefApplicationId(order));
    }

}
