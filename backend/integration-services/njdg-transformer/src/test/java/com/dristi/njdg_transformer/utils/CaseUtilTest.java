package com.dristi.njdg_transformer.utils;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.cases.CaseCriteria;
import com.dristi.njdg_transformer.model.cases.CaseSearchRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseUtilTest {

    @Mock
    private TransformerProperties properties;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper mapper;

    @InjectMocks
    private CaseUtil caseUtil;

    private CaseSearchRequest caseSearchRequest;
    private ObjectMapper realMapper;

    @BeforeEach
    void setUp() {
        realMapper = new ObjectMapper();

        CaseCriteria criteria = new CaseCriteria();
        criteria.setFilingNumber("FN-001");

        caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(RequestInfo.builder().build());
        caseSearchRequest.setCriteria(Collections.singletonList(criteria));
    }

    @Test
    void testSearchCaseDetails_Success() throws Exception {
        when(properties.getCaseHost()).thenReturn("http://case-service");
        when(properties.getCaseSearchPath()).thenReturn("/case/v1/_search");

        ObjectNode responseNode = realMapper.createObjectNode();
        ArrayNode criteriaArray = realMapper.createArrayNode();
        ObjectNode criteriaItem = realMapper.createObjectNode();
        ArrayNode responseList = realMapper.createArrayNode();
        ObjectNode caseNode = realMapper.createObjectNode();
        caseNode.put("cnrNumber", "CNR-001");
        responseList.add(caseNode);
        criteriaItem.set("responseList", responseList);
        criteriaArray.add(criteriaItem);
        responseNode.set("criteria", criteriaArray);

        Map<String, Object> response = new HashMap<>();
        response.put("criteria", Collections.singletonList(Collections.singletonMap("responseList", 
            Collections.singletonList(Collections.singletonMap("cnrNumber", "CNR-001")))));

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(response);
        when(mapper.readTree(anyString())).thenReturn(responseNode);
        when(mapper.writeValueAsString(any())).thenReturn("{}");

        JsonNode result = caseUtil.searchCaseDetails(caseSearchRequest);

        assertNotNull(result);
    }

    @Test
    void testSearchCaseDetails_EmptyResponseList() throws Exception {
        when(properties.getCaseHost()).thenReturn("http://case-service");
        when(properties.getCaseSearchPath()).thenReturn("/case/v1/_search");

        ObjectNode responseNode = realMapper.createObjectNode();
        ArrayNode criteriaArray = realMapper.createArrayNode();
        ObjectNode criteriaItem = realMapper.createObjectNode();
        ArrayNode responseList = realMapper.createArrayNode();
        criteriaItem.set("responseList", responseList);
        criteriaArray.add(criteriaItem);
        responseNode.set("criteria", criteriaArray);

        Map<String, Object> response = new HashMap<>();
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(response);
        when(mapper.readTree(anyString())).thenReturn(responseNode);
        when(mapper.writeValueAsString(any())).thenReturn("{}");

        JsonNode result = caseUtil.searchCaseDetails(caseSearchRequest);

        assertNull(result);
    }

    @Test
    void testSearchCaseDetails_InvalidResponseStructure() throws Exception {
        when(properties.getCaseHost()).thenReturn("http://case-service");
        when(properties.getCaseSearchPath()).thenReturn("/case/v1/_search");

        ObjectNode responseNode = realMapper.createObjectNode();
        responseNode.set("criteria", null);

        Map<String, Object> response = new HashMap<>();
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(response);
        when(mapper.readTree(anyString())).thenReturn(responseNode);
        when(mapper.writeValueAsString(any())).thenReturn("{}");

        assertThrows(CustomException.class, () -> caseUtil.searchCaseDetails(caseSearchRequest));
    }

    @Test
    void testSearchCaseDetails_RestTemplateException() throws Exception {
        when(properties.getCaseHost()).thenReturn("http://case-service");
        when(properties.getCaseSearchPath()).thenReturn("/case/v1/_search");

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        assertThrows(CustomException.class, () -> caseUtil.searchCaseDetails(caseSearchRequest));
    }

    @Test
    void testSearchCaseDetails_JsonProcessingException() throws Exception {
        when(properties.getCaseHost()).thenReturn("http://case-service");
        when(properties.getCaseSearchPath()).thenReturn("/case/v1/_search");

        Map<String, Object> response = new HashMap<>();
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(response);
        when(mapper.writeValueAsString(any())).thenThrow(new RuntimeException("JSON error"));

        assertThrows(CustomException.class, () -> caseUtil.searchCaseDetails(caseSearchRequest));
    }

    @Test
    void testSearchCaseDetails_NullResponse() throws Exception {
        when(properties.getCaseHost()).thenReturn("http://case-service");
        when(properties.getCaseSearchPath()).thenReturn("/case/v1/_search");

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(null);
        when(mapper.writeValueAsString(any())).thenReturn("null");
        when(mapper.readTree("null")).thenReturn(null);

        assertThrows(CustomException.class, () -> caseUtil.searchCaseDetails(caseSearchRequest));
    }
}
