package digit.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ServiceRequestRepositoryTest {

    @InjectMocks
    private ServiceRequestRepository repository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @Test
    public void testFetchResult_Success() {
        // Arrange
        StringBuilder uri = new StringBuilder("http://test.com/api");
        Object request = new Object();  // Mock or use a real object here
        Map<String, Object> mockResponse = Map.of("key", "value");  // Mock response from external service
        when(restTemplate.postForObject(any(String.class), any(Object.class), eq(Map.class)))
                .thenReturn(mockResponse);

        // Act
        Object result = repository.fetchResult(uri, request);

        // Assert
        assertNotNull(result);
        assertTrue(result instanceof Map);
        assertEquals("value", ((Map<?, ?>) result).get("key"));
        verify(restTemplate, times(1)).postForObject(uri.toString(), request, Map.class);
    }

    @Test
    public void testFetchResult_GenericException() {
        // Arrange
        StringBuilder uri = new StringBuilder("http://test.com/api");
        Object request = new Object();  // Mock or use a real object here
        when(restTemplate.postForObject(any(String.class), any(Object.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Unexpected error"));

        // Act & Assert
        Object result = repository.fetchResult(uri, request);

        // Assert
        assertNull(result);  // Since the exception is caught and no return value is set
        verify(restTemplate, times(1)).postForObject(uri.toString(), request, Map.class);
    }
}
