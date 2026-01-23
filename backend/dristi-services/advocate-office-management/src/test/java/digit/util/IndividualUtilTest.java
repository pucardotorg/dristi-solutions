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

import java.util.HashMap;
import java.util.Map;

import static digit.config.ServiceConstants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IndividualUtilTest {

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private Configuration configuration;

    @InjectMocks
    private IndividualUtil individualUtil;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        when(configuration.getIndividualHost()).thenReturn("http://individual-host");
        when(configuration.getIndividualSearchEndPoint()).thenReturn("/individual/v1/search");
    }

    @Test
    void testGetIndividualIdFromUserUuid_Success() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"individualId\":\"individual-123\"}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        String result = individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123");

        assertEquals("individual-123", result);
        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }

    @Test
    void testGetIndividualIdFromUserUuid_NullResponse() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(null);

        CustomException exception = assertThrows(CustomException.class, () -> individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123"));

        assertEquals(INDIVIDUAL_NOT_FOUND, exception.getCode());
        assertTrue(exception.getMessage().contains("user-uuid-123"));
    }

    @Test
    void testGetIndividualIdFromUserUuid_EmptyIndividualArray() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123"));

        assertEquals(INDIVIDUAL_NOT_FOUND, exception.getCode());
        assertTrue(exception.getMessage().contains("user-uuid-123"));
    }

    @Test
    void testGetIndividualIdFromUserUuid_MissingIndividualId() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"name\":\"John Doe\"}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testGetIndividualIdFromUserUuid_NullIndividualId() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"individualId\":null}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testGetIndividualIdFromUserUuid_BlankIndividualId() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"individualId\":\"   \"}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        CustomException exception = assertThrows(CustomException.class, () -> individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
        assertEquals(ADVOCATE_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testGetIndividualIdFromUserUuid_ExceptionDuringProcessing() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenThrow(new RuntimeException("Network error"));

        CustomException exception = assertThrows(CustomException.class, () -> individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123"));

        assertEquals(ADVOCATE_NOT_FOUND, exception.getCode());
    }

    @Test
    void testGetIndividualIdFromUserUuid_ConstructsCorrectUri() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"individualId\":\"individual-123\"}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        String result = individualUtil.getIndividualIdFromUserUuid(requestInfo, "pg.citya", "user-uuid-123");

        assertEquals("individual-123", result);
        verify(configuration, times(1)).getIndividualHost();
        verify(configuration, times(1)).getIndividualSearchEndPoint();
    }
}
