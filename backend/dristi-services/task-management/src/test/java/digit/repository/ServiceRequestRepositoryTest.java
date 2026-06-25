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
    private ServiceRequestRepository repository;

    private StringBuilder uri;
    private Map<String, Object> request;

    @BeforeEach
    void setUp() {
        uri = new StringBuilder("http://localhost:8080/api/test");
        request = new HashMap<>();
        request.put("key", "value");
    }

    @Test
    void fetchResult_Success_ReturnsResponse() {
        Map<String, Object> expectedResponse = new HashMap<>();
        expectedResponse.put("responseKey", "responseValue");

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(expectedResponse);

        Object result = repository.fetchResult(uri, request);

        assertNotNull(result);
        assertEquals(expectedResponse, result);
    }

    @Test
    void fetchResult_HttpClientErrorException_ThrowsServiceCallException() {
        HttpClientErrorException httpException = mock(HttpClientErrorException.class);
        when(httpException.getResponseBodyAsString()).thenReturn("Error response body");
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenThrow(httpException);

        assertThrows(ServiceCallException.class, () -> repository.fetchResult(uri, request));
    }

    @Test
    void fetchResult_GenericException_ReturnsNull() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection timeout"));

        Object result = repository.fetchResult(uri, request);

        assertNull(result);
    }

    @Test
    void fetchResult_NullResponse_ReturnsNull() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(null);

        Object result = repository.fetchResult(uri, request);

        assertNull(result);
    }

    @Test
    void fetchResult_EmptyUri_UsesEmptyString() {
        StringBuilder emptyUri = new StringBuilder("");
        Map<String, Object> expectedResponse = new HashMap<>();

        when(restTemplate.postForObject(eq(""), any(), eq(Map.class))).thenReturn(expectedResponse);

        Object result = repository.fetchResult(emptyUri, request);

        assertNotNull(result);
        verify(restTemplate).postForObject(eq(""), eq(request), eq(Map.class));
    }

    @Test
    void fetchResult_NullRequest_PassesNullToRestTemplate() {
        Map<String, Object> expectedResponse = new HashMap<>();
        when(restTemplate.postForObject(anyString(), isNull(), eq(Map.class))).thenReturn(expectedResponse);

        Object result = repository.fetchResult(uri, null);

        assertNotNull(result);
    }
}
