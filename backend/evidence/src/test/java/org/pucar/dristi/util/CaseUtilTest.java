package org.pucar.dristi.util;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
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

    @Mock
    private CacheUtil cacheUtil;

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

    @Test
    void testGetCaseDetailsForSingleTonCriteriaWithCacheHit() throws Exception {
        // Arrange
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(List.of(CaseCriteria.builder()
                        .tenantId("pb")
                        .filingNumber("CASE-001")
                        .build()))
                .build();

        CourtCase cachedCase = new CourtCase();
        cachedCase.setId(java.util.UUID.randomUUID());
        cachedCase.setFilingNumber("CASE-001");
        cachedCase.setTenantId("pb");

        String cacheKey = "pb:CASE-001";

        // Mock cache hit
        when(cacheUtil.findById(cacheKey)).thenReturn(cachedCase);
        when(mapper.convertValue(cachedCase, CourtCase.class)).thenReturn(cachedCase);

        // Act
        List<CourtCase> result = caseUtil.getCaseDetailsForSingleTonCriteria(request);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(cachedCase, result.get(0));
        
        // Verify cache was checked and no external call was made
        verify(cacheUtil, times(1)).findById(cacheKey);
        verify(mapper, times(1)).convertValue(cachedCase, CourtCase.class);
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(Map.class));
    }

    @Test
    void testGetCaseDetailsForSingleTonCriteriaWithCacheMiss() throws Exception {
        // Arrange
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(List.of(CaseCriteria.builder()
                        .tenantId("pb")
                        .filingNumber("CASE-001")
                        .build()))
                .build();

        String cacheKey = "pb:CASE-001";

        // Mock cache miss
        when(cacheUtil.findById(cacheKey)).thenReturn(null);

        CourtCase courtCase = new CourtCase();
        courtCase.setId(java.util.UUID.randomUUID());
        courtCase.setFilingNumber("CASE-001");
        courtCase.setTenantId("pb");

        CaseCriteria caseCriteria = CaseCriteria.builder()
                .tenantId("pb")
                .filingNumber("CASE-001")
                .responseList(List.of(courtCase))
                .build();

        CaseListResponse caseListResponse = CaseListResponse.builder()
                .criteria(List.of(caseCriteria))
                .build();

        // Mock external service response
        Map<String, Object> mockResponse = new HashMap<>();
        Map<String, Object> criteriaMap = new HashMap<>();
        List<Map<String, Object>> responseList = new ArrayList<>();
        
        Map<String, Object> caseData = new HashMap<>();
        caseData.put("id", courtCase.getId().toString());
        caseData.put("filingNumber", "CASE-001");
        caseData.put("tenantId", "pb");
        responseList.add(caseData);
        
        criteriaMap.put("responseList", responseList);
        mockResponse.put("criteria", List.of(criteriaMap));

        // Create JsonNode for what searchCaseDetails actually returns (single case)
        ObjectMapper realMapper = new ObjectMapper();
        JsonNode fullJsonNode = realMapper.valueToTree(mockResponse);
        JsonNode singleCaseNode = fullJsonNode.get("criteria").get(0).get("responseList").get(0);

        when(restTemplate.postForObject(anyString(), eq(request), eq(Map.class)))
                .thenReturn(mockResponse);
        when(mapper.readTree(anyString())).thenReturn(fullJsonNode);
        when(mapper.writeValueAsString(mockResponse)).thenReturn(realMapper.writeValueAsString(mockResponse));
        
        // Use lenient stubbing to avoid strict stubbing issues
        lenient().when(mapper.convertValue(any(JsonNode.class), eq(CaseListResponse.class))).thenReturn(caseListResponse);

        // Act
        List<CourtCase> result = caseUtil.getCaseDetailsForSingleTonCriteria(request);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(courtCase, result.get(0));
        
        // Verify cache operations
        verify(cacheUtil, times(1)).findById(cacheKey);
        verify(cacheUtil, times(1)).save(eq(cacheKey), eq(courtCase));
        verify(restTemplate, times(1)).postForObject(anyString(), eq(request), eq(Map.class));
    }

    @Test
    void testGetCaseDetailsForSingleTonCriteriaSearchCaseDetailsException() throws Exception {
        // Arrange
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(List.of(CaseCriteria.builder()
                        .tenantId("pb")
                        .filingNumber("CASE-001")
                        .build()))
                .build();

        String cacheKey = "pb:CASE-001";

        // Mock cache miss
        when(cacheUtil.findById(cacheKey)).thenReturn(null);

        // Mock exception in searchCaseDetails
        when(restTemplate.postForObject(anyString(), eq(request), eq(Map.class)))
                .thenThrow(new RuntimeException("Service unavailable"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseUtil.getCaseDetailsForSingleTonCriteria(request);
        });

        assertEquals("ERROR_WHILE_FETCHING_FROM_CASE", exception.getCode());
        assertTrue(exception.getMessage().contains("Service unavailable"));
        
        // Verify cache was checked but no save operation occurred
        verify(cacheUtil, times(1)).findById(cacheKey);
        verify(cacheUtil, never()).save(anyString(), any());
    }

    @Test
    void testGetCaseDetailsForSingleTonCriteriaNullResponse() throws Exception {
        // Arrange
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(List.of(CaseCriteria.builder()
                        .tenantId("pb")
                        .filingNumber("CASE-001")
                        .build()))
                .build();

        String cacheKey = "pb:CASE-001";

        // Mock cache miss
        when(cacheUtil.findById(cacheKey)).thenReturn(null);

        // Mock null response from external service
        when(restTemplate.postForObject(anyString(), eq(request), eq(Map.class)))
                .thenReturn(null);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseUtil.getCaseDetailsForSingleTonCriteria(request);
        });

        assertEquals("ERROR_WHILE_FETCHING_FROM_CASE", exception.getCode());
        assertTrue(exception.getMessage().contains("Received null response from case search"));
        
        verify(cacheUtil, times(1)).findById(cacheKey);
        verify(cacheUtil, never()).save(anyString(), any());
    }

    @Test
    void testGetCaseDetailsForSingleTonCriteriaInvalidResponseStructure() throws Exception {
        // Arrange
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(List.of(CaseCriteria.builder()
                        .tenantId("pb")
                        .filingNumber("CASE-001")
                        .build()))
                .build();

        String cacheKey = "pb:CASE-001";

        // Mock cache miss
        when(cacheUtil.findById(cacheKey)).thenReturn(null);

        // Mock response with invalid structure (no criteria)
        Map<String, Object> invalidResponse = new HashMap<>();
        invalidResponse.put("data", "some data");

        ObjectMapper realMapper = new ObjectMapper();
        JsonNode invalidJsonNode = realMapper.valueToTree(invalidResponse);

        when(restTemplate.postForObject(anyString(), eq(request), eq(Map.class)))
                .thenReturn(invalidResponse);
        when(mapper.writeValueAsString(invalidResponse)).thenReturn("{}");
        when(mapper.readTree(anyString())).thenReturn(invalidJsonNode);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseUtil.getCaseDetailsForSingleTonCriteria(request);
        });

        assertEquals("ERROR_WHILE_FETCHING_FROM_CASE", exception.getCode());
        assertTrue(exception.getMessage().contains("Invalid response structure"));
        
        verify(cacheUtil, times(1)).findById(cacheKey);
        verify(cacheUtil, never()).save(anyString(), any());
    }

    @Test
    void testGetCaseDetailsForSingleTonCriteriaEmptyResponseList() throws Exception {
        // Arrange
        CaseSearchRequest request = CaseSearchRequest.builder()
                .criteria(List.of(CaseCriteria.builder()
                        .tenantId("pb")
                        .filingNumber("CASE-001")
                        .build()))
                .build();

        String cacheKey = "pb:CASE-001";

        // Mock cache miss
        when(cacheUtil.findById(cacheKey)).thenReturn(null);

        // Mock response with empty responseList
        Map<String, Object> mockResponse = new HashMap<>();
        Map<String, Object> criteriaMap = new HashMap<>();
        criteriaMap.put("responseList", new ArrayList<>());
        mockResponse.put("criteria", List.of(criteriaMap));

        ObjectMapper realMapper = new ObjectMapper();
        JsonNode jsonNode = realMapper.valueToTree(mockResponse);

        when(restTemplate.postForObject(anyString(), eq(request), eq(Map.class)))
                .thenReturn(mockResponse);
        when(mapper.writeValueAsString(mockResponse)).thenReturn("{}");
        when(mapper.readTree(anyString())).thenReturn(jsonNode);

        // Act & Assert - This should return null from searchCaseDetails, causing NullPointerException
        assertThrows(NullPointerException.class, () -> {
            caseUtil.getCaseDetailsForSingleTonCriteria(request);
        });
        
        verify(cacheUtil, times(1)).findById(cacheKey);
        verify(cacheUtil, never()).save(anyString(), any());
    }
}
