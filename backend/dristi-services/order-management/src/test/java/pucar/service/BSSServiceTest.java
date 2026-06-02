package pucar.service;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import pucar.config.Configuration;
import pucar.util.*;
import pucar.web.models.*;
import pucar.web.models.hearing.Hearing;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.SCHEDULED;
import static pucar.config.ServiceConstants.SCHEDULE_OF_HEARING_DATE;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BSSServiceTest {

    @Mock
    private XmlRequestGenerator xmlRequestGenerator;

    @Mock
    private ESignUtil eSignUtil;

    @Mock
    private FileStoreUtil fileStoreUtil;

    @Mock
    private CipherUtil cipherUtil;

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private Configuration configuration;
    @Mock
    private ADiaryUtil aDiaryUtil;

    @Mock
    private HearingUtil hearingUtil;

    @Mock
    private CompositeOrderService compositeOrderService;

    @InjectMocks
    private BSSService bssService;

    private OrdersToSignRequest request;

    @BeforeEach
    void setUp() {
        OrdersCriteria criteria = new OrdersCriteria();
        criteria.setFileStoreId("123");
        criteria.setPlaceholder("Placeholder");
        criteria.setTenantId("tenant1");
        criteria.setOrderNumber("ORD123");

        request = new OrdersToSignRequest();
        request.setCriteria(Collections.singletonList(criteria));
        request.setRequestInfo(new RequestInfo());
    }

    private OrderListResponse orderResponse(String orderType, String orderCategory) {
        Order order = Order.builder()
                .orderNumber("ORD123")
                .tenantId("tenant1")
                .filingNumber("FIL123")
                .orderType(orderType)
                .orderCategory(orderCategory)
                .build();
        return OrderListResponse.builder().responseInfo(new ResponseInfo())
                .list(new ArrayList<>(Collections.singletonList(order))).build();
    }

    @Test
    void createOrderToSignRequest_Success() throws IOException {
        when(orderUtil.getOrders(any())).thenReturn(orderResponse("OTHER_ORDER", "INTERMEDIATE"));
        Coordinate coordinate = new Coordinate(0.0F, 0.0F, true, 1, "123", "kl");
        when(eSignUtil.getCoordinateForSign(any())).thenReturn(Collections.singletonList(coordinate));
        when(fileStoreUtil.fetchFileStoreObjectById(anyString(), anyString())).thenReturn(mock(Resource.class));
        when(cipherUtil.encodePdfToBase64(any())).thenReturn("base64EncodedString");
        when(xmlRequestGenerator.createXML(anyString(), any())).thenReturn("<xmlRequest>");
        when(configuration.getZoneId()).thenReturn("Asia/Kolkata");

        List<OrderToSign> result = bssService.createOrderToSignRequest(request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ORD123", result.get(0).getOrderNumber());
    }

    @Test
    void createOrderToSignRequest_CoordinatesMismatch() {
        when(orderUtil.getOrders(any())).thenReturn(orderResponse("OTHER_ORDER", "INTERMEDIATE"));
        when(eSignUtil.getCoordinateForSign(any())).thenReturn(Collections.emptyList());
        assertThrows(CustomException.class, () -> bssService.createOrderToSignRequest(request));
    }

    @Test
    void createOrderToSignRequest_ThrowsWhenHearingAlreadyScheduled() {
        when(orderUtil.getOrders(any())).thenReturn(orderResponse(SCHEDULE_OF_HEARING_DATE, "INTERMEDIATE"));
        Hearing scheduledHearing = Hearing.builder().status(SCHEDULED).build();
        when(hearingUtil.fetchHearing(any())).thenReturn(Collections.singletonList(scheduledHearing));

        CustomException exception = assertThrows(CustomException.class, () -> bssService.createOrderToSignRequest(request));
        assertEquals("HEARING_ALREADY_SCHEDULED_ERROR", exception.getCode());
    }

    @Test
    void createOrderToSignRequest_ThrowsWhenNextHearingDateOrderAndHearingScheduled() {
        OrderListResponse response = orderResponse("OTHER_ORDER", "INTERMEDIATE");
        response.getList().get(0).setNextHearingDate(1234567890L);
        when(orderUtil.getOrders(any())).thenReturn(response);
        Hearing scheduledHearing = Hearing.builder().status(SCHEDULED).build();
        when(hearingUtil.fetchHearing(any())).thenReturn(Collections.singletonList(scheduledHearing));

        CustomException exception = assertThrows(CustomException.class, () -> bssService.createOrderToSignRequest(request));
        assertEquals("HEARING_ALREADY_SCHEDULED_ERROR", exception.getCode());
    }

    @Test
    void updateOrderWithSignDoc_ExceptionWhileDecoding() throws IOException {
        UpdateSignedOrderRequest updateRequest = new UpdateSignedOrderRequest();
        SignedOrder signedOrder = new SignedOrder("ORD123", "base64Data", true, null, "tenant1");
        updateRequest.setSignedOrders(Collections.singletonList(signedOrder));
        when(orderUtil.getOrders(any())).thenReturn(OrderListResponse.builder().responseInfo(new ResponseInfo()).list(new ArrayList<>()).build());

        assertThrows(CustomException.class, () -> bssService.updateOrderWithSignDoc(updateRequest));
    }
}
