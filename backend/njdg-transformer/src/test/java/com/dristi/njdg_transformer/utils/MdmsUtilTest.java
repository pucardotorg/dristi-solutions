package com.dristi.njdg_transformer.utils;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.repository.ServiceRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.mdms.model.MdmsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MdmsUtilTest {

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private TransformerProperties configs;

    @InjectMocks
    private MdmsUtil mdmsUtil;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
    }

    @Test
    void testFetchMdmsData_Success() {
        when(configs.getMdmsHost()).thenReturn("http://mdms-service");
        when(configs.getMdmsEndPoint()).thenReturn("/egov-mdms-service/v1/_search");

        Map<String, Map<String, JSONArray>> mdmsRes = new HashMap<>();
        Map<String, JSONArray> moduleData = new HashMap<>();
        JSONArray masterData = new JSONArray();
        masterData.add(Collections.singletonMap("code", "TEST"));
        moduleData.put("TestMaster", masterData);
        mdmsRes.put("TestModule", moduleData);

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(mdmsRes);

        when(repository.fetchResult(any(), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(
                requestInfo, "kl.kollam", "TestModule", Collections.singletonList("TestMaster"));

        assertNotNull(result);
        assertEquals(1, result.size());
        assertTrue(result.containsKey("TestModule"));
    }

    @Test
    void testFetchMdmsData_EmptyMasterList() {
        when(configs.getMdmsHost()).thenReturn("http://mdms-service");
        when(configs.getMdmsEndPoint()).thenReturn("/egov-mdms-service/v1/_search");

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(new HashMap<>());

        when(repository.fetchResult(any(), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(
                requestInfo, "kl.kollam", "TestModule", Collections.emptyList());

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testFetchMdmsData_MultipleMasters() {
        when(configs.getMdmsHost()).thenReturn("http://mdms-service");
        when(configs.getMdmsEndPoint()).thenReturn("/egov-mdms-service/v1/_search");

        Map<String, Map<String, JSONArray>> mdmsRes = new HashMap<>();
        Map<String, JSONArray> moduleData = new HashMap<>();
        
        JSONArray master1Data = new JSONArray();
        master1Data.add(Collections.singletonMap("code", "M1"));
        moduleData.put("Master1", master1Data);
        
        JSONArray master2Data = new JSONArray();
        master2Data.add(Collections.singletonMap("code", "M2"));
        moduleData.put("Master2", master2Data);
        
        mdmsRes.put("TestModule", moduleData);

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(mdmsRes);

        when(repository.fetchResult(any(), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(
                requestInfo, "kl.kollam", "TestModule", Arrays.asList("Master1", "Master2"));

        assertNotNull(result);
        assertEquals(2, result.get("TestModule").size());
    }

    @Test
    void testFetchMdmsData_TenantIdWithDot() {
        when(configs.getMdmsHost()).thenReturn("http://mdms-service");
        when(configs.getMdmsEndPoint()).thenReturn("/egov-mdms-service/v1/_search");

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(new HashMap<>());

        when(repository.fetchResult(any(), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(
                requestInfo, "kl.kollam.sub", "TestModule", Collections.singletonList("TestMaster"));

        assertNotNull(result);
        // Should use "kl" as tenantId (first part before dot)
    }

    @Test
    void testFetchMdmsData_Exception() {
        when(configs.getMdmsHost()).thenReturn("http://mdms-service");
        when(configs.getMdmsEndPoint()).thenReturn("/egov-mdms-service/v1/_search");

        when(repository.fetchResult(any(), any())).thenThrow(new RuntimeException("Connection error"));

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(
                requestInfo, "kl.kollam", "TestModule", Collections.singletonList("TestMaster"));

        // Should not throw exception, returns null mdmsRes
        assertNull(result);
    }

    @Test
    void testFetchMdmsData_NullResponse() {
        when(configs.getMdmsHost()).thenReturn("http://mdms-service");
        when(configs.getMdmsEndPoint()).thenReturn("/egov-mdms-service/v1/_search");

        when(repository.fetchResult(any(), any())).thenReturn(null);

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(null);
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(
                requestInfo, "kl.kollam", "TestModule", Collections.singletonList("TestMaster"));

        assertNull(result);
    }
}
