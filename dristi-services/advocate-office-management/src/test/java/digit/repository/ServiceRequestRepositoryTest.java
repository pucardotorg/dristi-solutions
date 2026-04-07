package digit.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceRequestRepositoryTest {

    @Mock
    private ObjectMapper mapper;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ServiceRequestRepository serviceRequestRepository;

    private StringBuilder uri;
    private Map<String, Object> request;

    @BeforeEach
    void setUp() {
        uri = new StringBuilder("http://test-service/api/v1/endpoint");
        request = new HashMap<>();
        request.put("key", "value");
    }

    @Test
    void testFetchResult_Success() {
        Map<String, Object> expectedResponse = new HashMap<>();
        expectedResponse.put("status", "success");
        expectedResponse.put("data", "test-data");

        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenReturn(expectedResponse);

        Object result = serviceRequestRepository.fetchResult(uri, request);

        assertNotNull(result);
        assertTrue(result instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, Object> resultMap = (Map<String, Object>) result;
        assertEquals("success", resultMap.get("status"));
        assertEquals("test-data", resultMap.get("data"));

        verify(restTemplate, times(1)).postForObject(eq(uri.toString()), eq(request), eq(Map.class));
    }

    @Test
    void testFetchResult_HttpClientErrorException() {
        String errorBody = "Error response body";
        HttpClientErrorException exception = mock(HttpClientErrorException.class);
        when(exception.getResponseBodyAsString()).thenReturn(errorBody);

        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenThrow(exception);

        ServiceCallException serviceCallException = assertThrows(ServiceCallException.class, () -> {
            serviceRequestRepository.fetchResult(uri, request);
        });

        assertNotNull(serviceCallException);
        verify(exception, times(1)).getResponseBodyAsString();
    }

    @Test
    void testFetchResult_GenericException() {
        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));

        Object result = serviceRequestRepository.fetchResult(uri, request);

        assertNull(result);
    }

    @Test
    void testFetchResult_NullResponse() {
        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenReturn(null);

        Object result = serviceRequestRepository.fetchResult(uri, request);

        assertNull(result);
    }

    @Test
    void testFetchResult_EmptyResponse() {
        Map<String, Object> emptyResponse = new HashMap<>();

        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenReturn(emptyResponse);

        Object result = serviceRequestRepository.fetchResult(uri, request);

        assertNotNull(result);
        assertTrue(result instanceof Map);
        assertTrue(((Map<?, ?>) result).isEmpty());
    }

    @Test
    void testFetchResult_MultipleRequests() {
        Map<String, Object> response1 = new HashMap<>();
        response1.put("id", "1");

        Map<String, Object> response2 = new HashMap<>();
        response2.put("id", "2");

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenReturn(response1)
                .thenReturn(response2);

        Object result1 = serviceRequestRepository.fetchResult(uri, request);
        Object result2 = serviceRequestRepository.fetchResult(uri, request);

        assertNotNull(result1);
        assertNotNull(result2);
        assertNotEquals(result1, result2);

        verify(restTemplate, times(2)).postForObject(anyString(), any(), eq(Map.class));
    }

    @Test
    void testFetchResult_DifferentUris() {
        StringBuilder uri1 = new StringBuilder("http://service1/api");
        StringBuilder uri2 = new StringBuilder("http://service2/api");

        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenReturn(response);

        serviceRequestRepository.fetchResult(uri1, request);
        serviceRequestRepository.fetchResult(uri2, request);

        verify(restTemplate, times(1)).postForObject(eq(uri1.toString()), any(), eq(Map.class));
        verify(restTemplate, times(1)).postForObject(eq(uri2.toString()), any(), eq(Map.class));
    }
}
