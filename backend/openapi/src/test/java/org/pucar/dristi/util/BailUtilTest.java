package org.pucar.dristi.util;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.BailUtil;
import org.pucar.dristi.web.models.BailCriteria;
import org.pucar.dristi.web.models.BailListResponse;
import org.pucar.dristi.web.models.BailSearchRequest;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
public class BailUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private Configuration configs;

    @InjectMocks
    private BailUtil bailUtil;

    private BailCriteria bailCriteria;

    @BeforeEach
    public void setup() {
        bailCriteria = new BailCriteria();
        bailCriteria.setTenantId("tenant1");
        bailCriteria.setBailId("bail123");
        bailCriteria.setMobileNumber("1234567890");
    }

    @Test
    public void testFetchBails_Success() {
        String expectedUri = "http://bail-service/v1/search";
        when(configs.getBailServiceHost()).thenReturn("http://bail-service");

        Map<String, Object> responseMap = new HashMap<>();
        BailListResponse expectedResponse = new BailListResponse();

        when(restTemplate.postForObject(anyString(), any(BailSearchRequest.class), any(Class.class)))
                .thenReturn(responseMap);
        when(mapper.convertValue(responseMap, BailListResponse.class)).thenReturn(expectedResponse);

        BailListResponse actualResponse = bailUtil.fetchBails(bailCriteria);

        assertEquals(expectedResponse, actualResponse);

        // Use eq() matcher for the URI
        verify(restTemplate, times(1)).postForObject(
                eq(expectedUri),
                any(BailSearchRequest.class),
                any(Class.class)
        );
    }


    @Test
    public void testFetchBails_Exception() {
        when(configs.getBailServiceHost()).thenReturn("http://bail-service");
        when(restTemplate.postForObject(anyString(), any(BailSearchRequest.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Service down"));

        CustomException thrown = assertThrows(CustomException.class, () -> {
            bailUtil.fetchBails(bailCriteria);
        });

        // The exception message is the cause's message "Service down"
        assertEquals("Service down", thrown.getMessage());
    }


    @Test
    public void testFetchBailByBailIdAndMobileNumber() {
        String tenantId = "tenant1";
        String bailId = "bail123";
        String mobileNumber = "1234567890";

        BailListResponse expectedResponse = new BailListResponse();

        when(configs.getBailServiceHost()).thenReturn("http://bail-service");
        when(restTemplate.postForObject(anyString(), any(BailSearchRequest.class), any(Class.class)))
                .thenReturn(Collections.emptyMap());
        when(mapper.convertValue(Collections.emptyMap(), BailListResponse.class)).thenReturn(expectedResponse);

        BailListResponse actualResponse = bailUtil.fetchBailByBailIdAndMobileNumber(tenantId, bailId, mobileNumber);

        assertEquals(expectedResponse, actualResponse);
    }

    @Test
    public void testFetchBails_NullResponse() {
        when(configs.getBailServiceHost()).thenReturn("http://bail-service");
        when(restTemplate.postForObject(anyString(), any(BailSearchRequest.class), any(Class.class)))
                .thenReturn(null);
        when(mapper.convertValue(null, BailListResponse.class)).thenReturn(null);

        BailListResponse actualResponse = bailUtil.fetchBails(bailCriteria);

        assertEquals(null, actualResponse);
    }
}

