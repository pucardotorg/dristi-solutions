package digit.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ServiceRequestRepositoryTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ServiceRequestRepository repository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ------------------------------------------------------------------
    // POST – Success
    // ------------------------------------------------------------------
    @Test
    void testFetchResult_WhenSuccess() {
        StringBuilder uri = new StringBuilder("http://test-url");
        Object request = new Object();

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("status", "ok");

        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenReturn(mockResponse);

        Object result = repository.fetchResult(uri, request);

        assertNotNull(result);
        assertEquals(mockResponse, result);
    }

    // ------------------------------------------------------------------
    // POST – HttpClientErrorException → throws ServiceCallException
    // ------------------------------------------------------------------
    @Test
    void testFetchResult_WhenHttpClientErrorExceptionThrown() {
        StringBuilder uri = new StringBuilder("http://test-url");
        Object request = new Object();

        HttpClientErrorException httpError =
                HttpClientErrorException.create("BAD_REQUEST", HttpStatusCode.valueOf(400),
                        "Bad Request", null,
                        "Error occurred".getBytes(StandardCharsets.UTF_8),
                        StandardCharsets.UTF_8);

        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenThrow(httpError);

        ServiceCallException exception = assertThrows(
                ServiceCallException.class,
                () -> repository.fetchResult(uri, request)
        );

    }

    // ------------------------------------------------------------------
    // POST – Generic Exception → log & return null
    // ------------------------------------------------------------------
    @Test
    void testFetchResult_WhenGenericExceptionThrown() {
        StringBuilder uri = new StringBuilder("http://test-url");
        Object request = new Object();

        when(restTemplate.postForObject(eq(uri.toString()), eq(request), eq(Map.class)))
                .thenThrow(new RuntimeException("Something went wrong"));

        Object result = repository.fetchResult(uri, request);

        assertNull(result); // Should return null
    }

    // ------------------------------------------------------------------
    // GET – Success
    // ------------------------------------------------------------------
    @Test
    void testFetchResultGetForResource_WhenSuccess() {
        StringBuilder uri = new StringBuilder("http://test-url");

        Resource mockResource = mock(Resource.class);

        when(restTemplate.getForObject(eq(uri.toString()), eq(Resource.class)))
                .thenReturn(mockResource);

        Resource result = repository.fetchResultGetForResource(uri);

        assertNotNull(result);
        assertEquals(mockResource, result);
    }

    // ------------------------------------------------------------------
    // GET – HttpClientErrorException → throws ServiceCallException
    // ------------------------------------------------------------------
    @Test
    void testFetchResultGetForResource_WhenHttpClientErrorExceptionThrown() {
        StringBuilder uri = new StringBuilder("http://test-url");

        HttpClientErrorException httpError =
                HttpClientErrorException.create("BAD_REQUEST", HttpStatusCode.valueOf(400),
                        "Bad Request", null,
                        "Error occurred".getBytes(StandardCharsets.UTF_8),
                        StandardCharsets.UTF_8);

        when(restTemplate.getForObject(eq(uri.toString()), eq(Resource.class)))
                .thenThrow(httpError);

        ServiceCallException exception = assertThrows(
                ServiceCallException.class,
                () -> repository.fetchResultGetForResource(uri)
        );

    }

    // ------------------------------------------------------------------
    // GET – Generic Exception → log & return null
    // ------------------------------------------------------------------
    @Test
    void testFetchResultGetForResource_WhenGenericExceptionThrown() {
        StringBuilder uri = new StringBuilder("http://test-url");

        when(restTemplate.getForObject(eq(uri.toString()), eq(Resource.class)))
                .thenThrow(new RuntimeException("Something went wrong"));

        Resource result = repository.fetchResultGetForResource(uri);

        assertNull(result);
    }
}
