package pucar.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static pucar.config.ServiceConstants.VALUE;

@ExtendWith(MockitoExtension.class)
class ServiceRequestRepositoryTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ServiceRequestRepository serviceRequestRepository;

    private StringBuilder testUri;

    @BeforeEach
    void setUp() {
        testUri = new StringBuilder("http://test-url.com");
    }

    @Test
    void fetchResult_Success() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(Collections.singletonMap("key", VALUE));
        Object result = serviceRequestRepository.fetchResult(testUri, new Object());
        assertNotNull(result);
        assertEquals(VALUE, ((Map<?, ?>) result).get("key"));
    }

    @Test
    void fetchResult_HttpClientErrorException() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new HttpClientErrorException(org.springframework.http.HttpStatus.BAD_REQUEST, "Bad Request"));
        assertThrows(ServiceCallException.class, () -> serviceRequestRepository.fetchResult(testUri, new Object()));
    }

    @Test
    void fetchResultGetForEntity_Success() {
        ResponseEntity<Resource> mockResponse = mock(ResponseEntity.class);
        when(restTemplate.getForEntity(anyString(), eq(Resource.class))).thenReturn(mockResponse);
        ResponseEntity<Resource> response = serviceRequestRepository.fetchResultGetForEntity(testUri);
        assertNotNull(response);
    }

    @Test
    void fetchResultGetForEntity_HttpClientErrorException() {
        when(restTemplate.getForEntity(anyString(), eq(Resource.class)))
                .thenThrow(new HttpClientErrorException(org.springframework.http.HttpStatus.BAD_REQUEST, "Bad Request"));
        assertThrows(ServiceCallException.class, () -> serviceRequestRepository.fetchResultGetForEntity(testUri));
    }

    @Test
    void fetchResultPostForEntity_Success() {
        ResponseEntity<Object> mockResponse = mock(ResponseEntity.class);
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Object.class))).thenReturn(mockResponse);
        ResponseEntity<Object> response = serviceRequestRepository.fetchResultPostForEntity("http://test-url.com", mock(HttpEntity.class));
        assertNotNull(response);
    }

    @Test
    void fetchResultPostForEntity_HttpClientErrorException() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Object.class)))
                .thenThrow(new HttpClientErrorException(org.springframework.http.HttpStatus.BAD_REQUEST, "Bad Request"));
        assertThrows(ServiceCallException.class, () -> serviceRequestRepository.fetchResultPostForEntity("http://test-url.com", mock(HttpEntity.class)));
    }

    @Test
    void fetchResultGetForResource_Success() {
        Resource mockResource = mock(Resource.class);
        when(restTemplate.getForObject(anyString(), eq(Resource.class))).thenReturn(mockResource);
        Resource result = serviceRequestRepository.fetchResultGetForResource(testUri);
        assertNotNull(result);
    }

    @Test
    void fetchResultGetForResource_HttpClientErrorException() {
        when(restTemplate.getForObject(anyString(), eq(Resource.class)))
                .thenThrow(new HttpClientErrorException(org.springframework.http.HttpStatus.BAD_REQUEST, "Bad Request"));
        assertThrows(ServiceCallException.class, () -> serviceRequestRepository.fetchResultGetForResource(testUri));
    }
}
