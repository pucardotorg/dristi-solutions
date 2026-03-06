package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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

    @BeforeEach
    void setUp() {
        when(configuration.getOrderHost()).thenReturn("http://order-service");
        when(configuration.getOrderExistsEndPoint()).thenReturn("/order/exists");
        when(configuration.getOrderUpdateEndPoint()).thenReturn("/order/update");
        when(configuration.getOrderSearchEndPoint()).thenReturn("/order/search");
    }

    @Test
    void testFetchOrderDetails_Exception() {
        OrderExistsRequest request = new OrderExistsRequest();
        String url = "http://order-service/order/exists";

        when(serviceRequestRepository.fetchResult(new StringBuilder(url), request)).thenThrow(new RuntimeException("Service error"));

        assertThrows(CustomException.class, () -> orderUtil.fetchOrderDetails(request));
    }

}
