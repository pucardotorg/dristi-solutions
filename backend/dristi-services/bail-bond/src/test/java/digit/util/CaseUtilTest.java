package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import digit.config.Configuration;
import digit.web.models.CaseSearchRequest;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CaseUtilTest {

    private Configuration config;
    private ObjectMapper objectMapper;
    private RestTemplate restTemplate;
    private CaseUtil caseUtil;

    @BeforeEach
    void setup() {
        config = mock(Configuration.class);
        objectMapper = new ObjectMapper();
        restTemplate = mock(RestTemplate.class);
        caseUtil = new CaseUtil(config, objectMapper, restTemplate);
    }

    @Test
    void testSearchCaseDetailsSuccess() throws Exception {
        // Given
        String host = "http://localhost";
        String path = "/case/v1/search";
        when(config.getCaseHost()).thenReturn(host);
        when(config.getCaseSearchPath()).thenReturn(path);

        CaseSearchRequest request = new CaseSearchRequest();

        Map<String, Object> mockResponse = new HashMap<>();
        Map<String, Object> innerCriteria = new HashMap<>();
        Map<String, String> caseDetail = new HashMap<>();
        caseDetail.put("courtId", "COURT-123");
        innerCriteria.put("responseList", List.of(caseDetail));
        mockResponse.put("criteria", List.of(innerCriteria));

        when(restTemplate.postForObject(eq(host + path), any(), eq(Map.class)))
                .thenReturn(mockResponse);

        // When
        JsonNode result = caseUtil.searchCaseDetails(request);

        // Then
        assertNotNull(result);
        assertEquals("COURT-123", result.get(0).get("courtId").asText());
    }

    @Test
    void testSearchCaseDetails_InvalidStructure_ThrowsCustomException() {
        // Given
        when(config.getCaseHost()).thenReturn("http://localhost");
        when(config.getCaseSearchPath()).thenReturn("/case/v1/search");

        CaseSearchRequest request = new CaseSearchRequest();

        Map<String, Object> invalidResponse = new HashMap<>(); // No "criteria"

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenReturn(invalidResponse);

        // When / Then
        CustomException ex = assertThrows(CustomException.class, () -> {
            caseUtil.searchCaseDetails(request);
        });

        assertEquals(ERROR_WHILE_FETCHING_FROM_CASE, ex.getCode());
    }

    @Test
    void testSearchCaseDetails_ExceptionDuringProcessing_ThrowsCustomException() {
        // Given
        when(config.getCaseHost()).thenReturn("http://localhost");
        when(config.getCaseSearchPath()).thenReturn("/case/v1/search");

        CaseSearchRequest request = new CaseSearchRequest();

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Service down"));

        // When / Then
        CustomException ex = assertThrows(CustomException.class, () -> {
            caseUtil.searchCaseDetails(request);
        });

        assertEquals(ERROR_WHILE_FETCHING_FROM_CASE, ex.getCode());
        assertTrue(ex.getMessage().contains("Service down"));
    }

    @Test
    void testExtractFieldsSuccess() {
        // Given
        ObjectNode caseNode = objectMapper.createObjectNode();
        caseNode.put("courtId", "C1");
        caseNode.put("caseTitle", "ABC vs XYZ");
        caseNode.put("cnrNumber", "CNR123");
        caseNode.put("caseType", "CMP");
        caseNode.put("courtCaseNumber", "CCN-456");
        caseNode.put("cmpNumber", "CMP789");
        caseNode.put("id", "CASE123");

        ArrayNode arrayNode = objectMapper.createArrayNode();
        arrayNode.add(caseNode);

        // Then
        assertEquals("C1", caseUtil.getCourtId(arrayNode));
        assertEquals("ABC vs XYZ", caseUtil.getCaseTitle(arrayNode));
        assertEquals("CNR123", caseUtil.getCnrNumber(arrayNode));
        assertEquals("CMP", caseUtil.getCaseType(arrayNode));
        assertEquals("CCN-456", caseUtil.getCourtCaseNumber(arrayNode));
        assertEquals("CMP789", caseUtil.getCmpNumber(arrayNode));
        assertEquals("CASE123", caseUtil.getCaseId(arrayNode));
    }

    @Test
    void testExtractField_NullOrEmpty_ShouldReturnNull() {
        // Given
        ArrayNode emptyArray = objectMapper.createArrayNode();
        assertNull(caseUtil.getCaseTitle(emptyArray));

        ArrayNode arrayNode = objectMapper.createArrayNode();
        ObjectNode nodeWithoutField = objectMapper.createObjectNode(); // no "courtId"
        arrayNode.add(nodeWithoutField);
        assertNull(caseUtil.getCourtId(arrayNode));
    }
}
