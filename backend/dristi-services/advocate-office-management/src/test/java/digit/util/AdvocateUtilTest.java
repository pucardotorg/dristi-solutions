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
    void testSearchAdvocateById_Success() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"advocates\":[{\"responseList\":[{\"isActive\":true,\"id\":\"adv-123\",\"individualId\":\"ind-123\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = advocateUtil.searchAdvocateById(requestInfo, "pg.citya", "adv-123");

        assertNotNull(result);
        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }

    @Test
    void testSearchAdvocateById_NullResponse() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(null);

        JsonNode result = advocateUtil.searchAdvocateById(requestInfo, "pg.citya", "adv-123");

        assertNull(result);
    }

    @Test
    void testSearchAdvocateById_EmptyAdvocatesList() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"advocates\":[]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = advocateUtil.searchAdvocateById(requestInfo, "pg.citya", "adv-123");

        assertNull(result);
    }

    @Test
    void testSearchAdvocateById_ExceptionDuringProcessing() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenThrow(new RuntimeException("Network error"));

        JsonNode result = advocateUtil.searchAdvocateById(requestInfo, "pg.citya", "adv-123");

        assertNull(result);
    }

    @Test
    void testSearchClerkById_Success() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"clerks\":[{\"responseList\":[{\"isActive\":true,\"id\":\"clerk-123\",\"individualId\":\"ind-123\"}]}]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = advocateUtil.searchClerkById(requestInfo, "pg.citya", "clerk-123");

        assertNotNull(result);
        verify(serviceRequestRepository, times(1)).fetchResult(any(), any());
    }

    @Test
    void testSearchClerkById_NullResponse() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(null);

        JsonNode result = advocateUtil.searchClerkById(requestInfo, "pg.citya", "clerk-123");

        assertNull(result);
    }

    @Test
    void testSearchClerkById_EmptyClerksList() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        String jsonResponse = "{\"clerks\":[]}";

        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(mockResponse);
        when(objectMapper.valueToTree(any())).thenReturn(new ObjectMapper().readTree(jsonResponse));

        JsonNode result = advocateUtil.searchClerkById(requestInfo, "pg.citya", "clerk-123");

        assertNull(result);
    }

    @Test
    void testSearchClerkById_ExceptionDuringProcessing() {
        when(serviceRequestRepository.fetchResult(any(), any())).thenThrow(new RuntimeException("Network error"));

        JsonNode result = advocateUtil.searchClerkById(requestInfo, "pg.citya", "clerk-123");

        assertNull(result);
    }

    @Test
    void testIsActive_ActiveNode() throws Exception {
        String jsonResponse = "{\"isActive\":true}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertTrue(advocateUtil.isActive(node));
    }

    @Test
    void testIsActive_InactiveNode() throws Exception {
        String jsonResponse = "{\"isActive\":false}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertFalse(advocateUtil.isActive(node));
    }

    @Test
    void testIsActive_NullNode() {
        assertFalse(advocateUtil.isActive(null));
    }

    @Test
    void testGetIndividualId_Success() throws Exception {
        String jsonResponse = "{\"individualId\":\"ind-123\"}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertEquals("ind-123", advocateUtil.getIndividualId(node));
    }

    @Test
    void testGetIndividualId_NullNode() {
        assertNull(advocateUtil.getIndividualId(null));
    }

    @Test
    void testGetIndividualId_MissingIndividualId() throws Exception {
        String jsonResponse = "{\"name\":\"John\"}";
        JsonNode node = new ObjectMapper().readTree(jsonResponse);

        assertNull(advocateUtil.getIndividualId(node));
    }
}
