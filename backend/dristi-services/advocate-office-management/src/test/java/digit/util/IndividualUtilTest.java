package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import org.egov.common.contract.request.RequestInfo;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
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
    void testSearchIndividualByIndividualId_Success() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"individualId\":\"individual-123\",\"userUuid\":\"user-uuid-123\"}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = individualUtil.searchIndividualByIndividualId(requestInfo, "pg.citya", "individual-123");

        assertNotNull(result);
        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }

    @Test
    void testSearchIndividualByIndividualId_NullResponse() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(null);

        JsonNode result = individualUtil.searchIndividualByIndividualId(requestInfo, "pg.citya", "individual-123");

        assertNull(result);
    }

    @Test
    void testSearchIndividualByIndividualId_EmptyIndividualArray() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = individualUtil.searchIndividualByIndividualId(requestInfo, "pg.citya", "individual-123");

        assertNull(result);
    }

    @Test
    void testSearchIndividualByIndividualId_ExceptionDuringProcessing() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenThrow(new RuntimeException("Network error"));

        JsonNode result = individualUtil.searchIndividualByIndividualId(requestInfo, "pg.citya", "individual-123");

        assertNull(result);
    }

    @Test
    void testGetUserUuid_Success() throws Exception {
        String jsonResponse = "{\"userUuid\":\"user-uuid-123\"}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertEquals("user-uuid-123", individualUtil.getUserUuid(node));
    }

    @Test
    void testGetUserUuid_NullNode() {
        assertNull(individualUtil.getUserUuid(null));
    }

    @Test
    void testGetUserUuid_MissingUserUuid() throws Exception {
        String jsonResponse = "{\"name\":\"John Doe\"}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertNull(individualUtil.getUserUuid(node));
    }

    @Test
    void testGetUserUuid_BlankUserUuid() throws Exception {
        String jsonResponse = "{\"userUuid\":\"   \"}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertNull(individualUtil.getUserUuid(node));
    }

    @Test
    void testSearchIndividualByIndividualId_ConstructsCorrectUri() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"Individual\":[{\"individualId\":\"individual-123\",\"userUuid\":\"user-uuid-123\"}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = individualUtil.searchIndividualByIndividualId(requestInfo, "pg.citya", "individual-123");

        assertNotNull(result);
        verify(configuration, times(1)).getIndividualHost();
        verify(configuration, times(1)).getIndividualSearchEndPoint();
    }
}
