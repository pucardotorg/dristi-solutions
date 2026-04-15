package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EtreasuryUtilTest {

    @Mock private RestTemplate restTemplate;
    @Mock private Configuration configs;
    @Spy  private ObjectMapper mapper = new ObjectMapper();

    @InjectMocks
    private EtreasuryUtil etreasuryUtil;

    private CtcApplicationRequest ctcRequest;

    @BeforeEach
    void setUp() {
        lenient().when(configs.getEtreasuryHost()).thenReturn("http://localhost:8090");
        lenient().when(configs.getEtreasuryDemandCreateEndPoint()).thenReturn("/demand/_create");
        lenient().when(configs.getEtreasuryPaymentReceiptEndPoint()).thenReturn("/payment/receipt");
        lenient().when(configs.getCtcBusinessServiceName()).thenReturn("ctc-services");

        CtcApplication app = CtcApplication.builder()
                .filingNumber("FIL-001").tenantId("pb").build();
        ctcRequest = CtcApplicationRequest.builder()
                .requestInfo(RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build())
                .ctcApplication(app).build();
    }

    @Test
    void createDemand_shouldPostDemandRequest() {
        Calculation calc = Calculation.builder().totalAmount(35.0).tenantId("pb").build();

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(new HashMap<>());

        assertDoesNotThrow(() -> etreasuryUtil.createDemand(ctcRequest, "CA-001_FEE", calc));

        verify(restTemplate).postForObject(eq("http://localhost:8090/demand/_create"), any(DemandCreateRequest.class), eq(Map.class));
    }

    @Test
    void createDemand_shouldThrowCustomExceptionOnError() {
        Calculation calc = Calculation.builder().totalAmount(35.0).tenantId("pb").build();

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("service down"));

        assertThrows(CustomException.class, () -> etreasuryUtil.createDemand(ctcRequest, "CA-001_FEE", calc));
    }

    @Test
    void getPaymentReceipt_shouldReturnJsonNode() {
        Map<String, Object> mockResponse = Map.of("billId", "bill-1", "status", "PAID");

        when(restTemplate.postForObject(anyString(), any(), eq(Object.class))).thenReturn(mockResponse);

        JsonNode result = etreasuryUtil.getPaymentReceipt(ctcRequest.getRequestInfo(), "bill-1");

        assertNotNull(result);
        assertEquals("bill-1", result.get("billId").asText());
    }

    @Test
    void getPaymentReceipt_shouldThrowCustomExceptionOnError() {
        when(restTemplate.postForObject(anyString(), any(), eq(Object.class)))
                .thenThrow(new RuntimeException("error"));

        assertThrows(CustomException.class,
                () -> etreasuryUtil.getPaymentReceipt(ctcRequest.getRequestInfo(), "bill-1"));
    }
}
