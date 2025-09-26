package org.pucar.dristi.util;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
public class CaseUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private Configuration configs;

    @Mock
    private ServiceRequestRepository repository;

    @InjectMocks
    private CaseUtil caseUtil;

    @BeforeEach
    void setUp() {
        lenient().when(configs.getCaseHost()).thenReturn("http://localhost:8080");
        lenient().when(configs.getCaseExistsPath()).thenReturn("/caseExists");
        lenient().when(configs.getAddWitnessEndpoint()).thenReturn("/witness/add");
        lenient().when(configs.getCaseSearchPath()).thenReturn("/case/search");
    }

    @Test
    void testFetchCaseDetailsSuccess(){
        CaseExistsRequest request = new CaseExistsRequest();
        Map<String, Object> response = new HashMap<>();
        response.put("criteria", List.of(Map.of("exists", true)));

        CaseExistsResponse caseExistsResponse = CaseExistsResponse.builder()
                .criteria(List.of(CaseExists.builder().exists(true).build()))
                .build();

        when(restTemplate.postForObject(any(String.class), eq(request), eq(Map.class)))
                .thenReturn(response);
        when(mapper.convertValue(response, CaseExistsResponse.class))
                .thenReturn(caseExistsResponse);

        Boolean result = caseUtil.fetchCaseDetails(request);
        assertTrue(result);
    }

    @Test
    void testFetchCaseDetailsDoesNotExist(){
        CaseExistsRequest request = new CaseExistsRequest();
        Map<String, Object> response = new HashMap<>();
        response.put("criteria", List.of(Map.of("exists", false)));

        CaseExistsResponse caseExistsResponse = CaseExistsResponse.builder()
                .criteria(List.of(CaseExists.builder().exists(false).build()))
                .build();

        when(restTemplate.postForObject(any(String.class), eq(request), eq(Map.class)))
                .thenReturn(response);
        when(mapper.convertValue(response, CaseExistsResponse.class))
                .thenReturn(caseExistsResponse);

        Boolean result = caseUtil.fetchCaseDetails(request);
        assertFalse(result);
    }


    @Test
    void testFetchCaseDetailsException() {
        CaseExistsRequest request = new CaseExistsRequest();

        when(restTemplate.postForObject(any(String.class), eq(request), eq(Map.class)))
                .thenThrow(new RuntimeException("Error"));
        assertThrows(RuntimeException.class, () -> {
            caseUtil.fetchCaseDetails(request);
        });
    }

    @Test
    void testUpdateWitnessDetailsSuccess() {
        // Arrange
        WitnessDetailsRequest request = WitnessDetailsRequest.builder()
                .requestInfo(new RequestInfo())
                .caseFilingNumber("CASE123")
                .tenantId("tenant1")
                .witnessDetails(List.of(new WitnessDetails()))
                .build();

        Object mockResponse = new HashMap<>();
        JsonNode mockJsonNode = mapper.createObjectNode();

        when(repository.fetchResult(any(StringBuilder.class), eq(request)))
                .thenReturn(mockResponse);
        when(mapper.valueToTree(mockResponse))
                .thenReturn(mockJsonNode);

        // Act & Assert - Should not throw any exception
        caseUtil.updateWitnessDetails(request);

        // Verify interactions
        verify(repository, times(1)).fetchResult(any(StringBuilder.class), eq(request));
        verify(mapper, times(1)).valueToTree(mockResponse);
    }

    @Test
    void testUpdateWitnessDetailsHttpClientErrorException() {
        // Arrange
        WitnessDetailsRequest request = WitnessDetailsRequest.builder()
                .requestInfo(new RequestInfo())
                .caseFilingNumber("CASE123")
                .tenantId("tenant1")
                .witnessDetails(List.of(new WitnessDetails()))
                .build();

        Object mockResponse = new HashMap<>();
        HttpClientErrorException httpException = new HttpClientErrorException(
                org.springframework.http.HttpStatus.BAD_REQUEST, 
                "Bad Request", 
                "Error response body".getBytes(), 
                null
        );

        when(repository.fetchResult(any(StringBuilder.class), eq(request)))
                .thenReturn(mockResponse);
        when(mapper.valueToTree(mockResponse))
                .thenThrow(httpException);

        // Act & Assert
        ServiceCallException exception = assertThrows(ServiceCallException.class, () -> {
            caseUtil.updateWitnessDetails(request);
        });

        verify(repository, times(1)).fetchResult(any(StringBuilder.class), eq(request));
        verify(mapper, times(1)).valueToTree(mockResponse);
    }
}
