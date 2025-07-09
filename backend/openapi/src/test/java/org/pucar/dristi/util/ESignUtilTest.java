package org.pucar.dristi.util;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.ESignUtil;
import org.pucar.dristi.web.models.ESignRequest;
import org.pucar.dristi.web.models.ESignResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
public class ESignUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration configs;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private HttpServletRequest servletRequest;

    @InjectMocks
    private ESignUtil eSignUtil;

    private ESignRequest eSignRequest;

    @BeforeEach
    public void setup() {
        eSignRequest = new ESignRequest();
        // Initialize eSignRequest fields if any
    }

    @Test
    public void testCallESignService_Success() {
        String host = "http://esign-service";
        String endpoint = "/v1/sign";
        when(configs.getESignHost()).thenReturn(host);
        when(configs.getESignEndpoint()).thenReturn(endpoint);

        // Mock headers enumeration
        Enumeration<String> headerNames = Collections.enumeration(Collections.singletonList("Authorization"));
        when(servletRequest.getHeaderNames()).thenReturn(headerNames);
        Enumeration<String> headerValues = Collections.enumeration(Collections.singletonList("Bearer token"));
        when(servletRequest.getHeaders("Authorization")).thenReturn(headerValues);

        Map<String, Object> responseMap = new HashMap<>();
        ResponseEntity<Map> responseEntity = ResponseEntity.ok(responseMap);

        when(restTemplate.exchange(eq(host + endpoint), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(responseEntity);

        ESignResponse expectedResponse = new ESignResponse();
        when(mapper.convertValue(responseMap, ESignResponse.class)).thenReturn(expectedResponse);

        ESignResponse actualResponse = eSignUtil.callESignService(eSignRequest, servletRequest);

        assertEquals(expectedResponse, actualResponse);

        verify(restTemplate, times(1)).exchange(eq(host + endpoint), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    public void testCallESignService_Exception() {
        String host = "http://esign-service";
        String endpoint = "/v1/sign";
        when(configs.getESignHost()).thenReturn(host);
        when(configs.getESignEndpoint()).thenReturn(endpoint);

        when(servletRequest.getHeaderNames()).thenReturn(null);

        when(restTemplate.exchange(eq(host + endpoint), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Service down"));

        CustomException thrown = assertThrows(CustomException.class, () -> {
            eSignUtil.callESignService(eSignRequest, servletRequest);
        });

        assertEquals("Service down", thrown.getMessage());
    }

    @Test
    public void testCallESignService_NoHeaders() {
        String host = "http://esign-service";
        String endpoint = "/v1/sign";
        when(configs.getESignHost()).thenReturn(host);
        when(configs.getESignEndpoint()).thenReturn(endpoint);

        when(servletRequest.getHeaderNames()).thenReturn(null);

        Map<String, Object> responseMap = new HashMap<>();
        ResponseEntity<Map> responseEntity = ResponseEntity.ok(responseMap);

        when(restTemplate.exchange(eq(host + endpoint), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(responseEntity);

        ESignResponse expectedResponse = new ESignResponse();
        when(mapper.convertValue(responseMap, ESignResponse.class)).thenReturn(expectedResponse);

        ESignResponse actualResponse = eSignUtil.callESignService(eSignRequest, servletRequest);

        assertEquals(expectedResponse, actualResponse);
    }
}

