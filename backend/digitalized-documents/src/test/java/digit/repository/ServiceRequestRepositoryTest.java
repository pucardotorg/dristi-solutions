package digit.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static digit.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static digit.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceRequestRepositoryTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ServiceRequestRepository serviceRequestRepository;

    private StringBuilder uriBuilder;

    @BeforeEach
    void setUp() {
        uriBuilder = new StringBuilder("http://test-service/api/v1/endpoint");
        when(objectMapper.getDeserializationConfig()).thenReturn(null);
    }

    @Test
    void testFetchResult_Success() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("key", "value");
        
        Map<String, Object> expectedResponse = new HashMap<>();
        expectedResponse.put("status", "SUCCESS");
        
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenReturn(expectedResponse);

        // Act
        Object response = serviceRequestRepository.fetchResult(uriBuilder, request);

        // Assert
        assertNotNull(response);
        assertEquals(expectedResponse, response);
        verify(restTemplate).postForObject(eq(uriBuilder.toString()), eq(request), eq(Map.class));
    }

    @Test
    void testFetchResult_HttpClientError() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        String errorResponse = "{\"error\": \"Bad Request\"}";
        
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "Bad Request", 
                        errorResponse.getBytes(StandardCharsets.UTF_8), null));

        // Act & Assert
        ServiceCallException exception = assertThrows(ServiceCallException.class, 
            () -> serviceRequestRepository.fetchResult(uriBuilder, request));
        
        assertEquals(errorResponse, exception.getMessage());
        verify(restTemplate).postForObject(eq(uriBuilder.toString()), eq(request), eq(Map.class));
    }

    @Test
    void testFetchResult_GenericError() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        // Act
        Object response = serviceRequestRepository.fetchResult(uriBuilder, request);

        // Assert
        assertNull(response);
        verify(restTemplate).postForObject(eq(uriBuilder.toString()), eq(request), eq(Map.class));
    }

    @Test
    void testFetchResultGetForResource_Success() {
        // Arrange
        ByteArrayResource expectedResource = new ByteArrayResource("test content".getBytes(StandardCharsets.UTF_8));
        
        when(restTemplate.getForObject(anyString(), eq(Resource.class)))
                .thenReturn(expectedResource);

        // Act
        Resource result = serviceRequestRepository.fetchResultGetForResource(uriBuilder);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResource, result);
        verify(restTemplate).getForObject(eq(uriBuilder.toString()), eq(Resource.class));
    }

    @Test
    void testFetchResultGetForResource_HttpClientError() {
        // Arrange
        String errorResponse = "{\"error\": \"Not Found\"}";
        
        when(restTemplate.getForObject(anyString(), eq(Resource.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "Not Found", 
                        errorResponse.getBytes(StandardCharsets.UTF_8), null));

        // Act & Assert
        ServiceCallException exception = assertThrows(ServiceCallException.class, 
            () -> serviceRequestRepository.fetchResultGetForResource(uriBuilder));
        
        assertEquals(errorResponse, exception.getMessage());
        verify(restTemplate).getForObject(eq(uriBuilder.toString()), eq(Resource.class));
    }

    @Test
    void testFetchResultGetForResource_GenericError() {
        // Arrange
        when(restTemplate.getForObject(anyString(), eq(Resource.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        // Act
        Resource result = serviceRequestRepository.fetchResultGetForResource(uriBuilder);

        // Assert
        assertNull(result);
        verify(restTemplate).getForObject(eq(uriBuilder.toString()), eq(Resource.class));
    }
}
