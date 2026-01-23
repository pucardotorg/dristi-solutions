package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.HashMap;
import java.util.Map;

import static digit.config.ServiceConstants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdvocateUtilTest {

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private Configuration configuration;

    @InjectMocks
    private AdvocateUtil advocateUtil;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        when(configuration.getAdvocateHost()).thenReturn("http://advocate-host");
        when(configuration.getAdvocateSearchEndPoint()).thenReturn("/advocate/v1/search");
        when(configuration.getAdvocateClerkSearchEndPoint()).thenReturn("/advocate/v1/clerk/search");
    }

    @Test
    void testValidateActiveAdvocateExists_Success() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"advocates\":[{\"responseList\":[{\"isActive\":true,\"id\":\"adv-123\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        assertDoesNotThrow(() -> advocateUtil.validateActiveAdvocateExists(requestInfo, "individual-id-123"));

        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }

    @Test
    void testValidateActiveAdvocateExists_NullResponse() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(null);

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveAdvocateExists(requestInfo, "individual-id-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
    }

    @Test
    void testValidateActiveAdvocateExists_EmptyAdvocatesList() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"advocates\":[]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveAdvocateExists(requestInfo, "individual-id-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateActiveAdvocateExists_NoActiveAdvocate() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"advocates\":[{\"responseList\":[{\"isActive\":false,\"id\":\"adv-123\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveAdvocateExists(requestInfo, "individual-id-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateActiveAdvocateExists_ExceptionDuringProcessing() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenThrow(new RuntimeException("Network error"));

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveAdvocateExists(requestInfo, "individual-id-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
    }

    @Test
    void testValidateActiveClerkExists_Success() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"clerks\":[{\"responseList\":[{\"isActive\":true,\"id\":\"clerk-123\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        assertDoesNotThrow(() -> advocateUtil.validateActiveClerkExists(requestInfo, "pg.citya", "individual-id-123"));

        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }

    @Test
    void testValidateActiveClerkExists_NullResponse() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(null);

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveClerkExists(requestInfo, "pg.citya", "individual-id-123"));

        assertEquals(ADVOCATE_CLERK_NOT_FOUND, exception.getCode());
    }

    @Test
    void testValidateActiveClerkExists_EmptyClerksList() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"clerks\":[]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveClerkExists(requestInfo, "pg.citya", "individual-id-123"));

        assertEquals(ADVOCATE_CLERK_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_CLERK_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateActiveClerkExists_NoActiveClerk() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"clerks\":[{\"responseList\":[{\"isActive\":false,\"id\":\"clerk-123\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveClerkExists(requestInfo, "pg.citya", "individual-id-123"));

        assertEquals(ADVOCATE_CLERK_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_CLERK_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateActiveClerkExists_ExceptionDuringProcessing() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenThrow(new RuntimeException("Network error"));

        CustomException exception = assertThrows(CustomException.class, () -> advocateUtil.validateActiveClerkExists(requestInfo, "pg.citya", "individual-id-123"));

        assertEquals(ADVOCATE_CLERK_NOT_FOUND, exception.getCode());
    }

    @Test
    void testValidateActiveAdvocateExists_MultipleAdvocatesOneActive() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"advocates\":[{\"responseList\":[{\"isActive\":false,\"id\":\"adv-1\"},{\"isActive\":true,\"id\":\"adv-2\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        assertDoesNotThrow(() -> advocateUtil.validateActiveAdvocateExists(requestInfo, "individual-id-123"));

        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }
}
