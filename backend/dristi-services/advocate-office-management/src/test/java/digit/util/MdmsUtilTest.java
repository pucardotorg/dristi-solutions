package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.mdms.model.MdmsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MdmsUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private Configuration configs;

    @InjectMocks
    private MdmsUtil mdmsUtil;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        when(configs.getMdmsHost()).thenReturn("http://mdms-host");
        when(configs.getMdmsEndPoint()).thenReturn("/mdms/v1/_search");
    }

    @Test
    void testFetchMdmsData_Success() {
        List<String> masterNameList = Arrays.asList("Master1", "Master2");
        Map<String, Object> mockResponse = new HashMap<>();

        Map<String, Map<String, JSONArray>> mdmsRes = new HashMap<>();
        Map<String, JSONArray> moduleData = new HashMap<>();
        moduleData.put("Master1", new JSONArray());
        moduleData.put("Master2", new JSONArray());
        mdmsRes.put("TestModule", moduleData);

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(mdmsRes);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(mockResponse);
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(requestInfo, "pg.citya", "TestModule", masterNameList);

        assertNotNull(result);
        assertTrue(result.containsKey("TestModule"));
        assertEquals(2, result.get("TestModule").size());

        verify(restTemplate, times(1)).postForObject(anyString(), any(), eq(Map.class));
        verify(mapper, times(1)).convertValue(any(), eq(MdmsResponse.class));
    }

    @Test
    void testFetchMdmsData_EmptyMasterList() {
        List<String> masterNameList = Collections.emptyList();
        Map<String, Object> mockResponse = new HashMap<>();
        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(new HashMap<>());

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(mockResponse);
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(requestInfo, "pg.citya", "TestModule", masterNameList);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testFetchMdmsData_ExceptionHandling() {
        List<String> masterNameList = List.of("Master1");

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenThrow(new RuntimeException("Network error"));

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(requestInfo, "pg.citya", "TestModule", masterNameList);

        assertNull(result);
    }

    @Test
    void testFetchMdmsData_TenantIdWithDot() {
        List<String> masterNameList = List.of("Master1");
        Map<String, Object> mockResponse = new HashMap<>();
        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(new HashMap<>());

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(mockResponse);
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        mdmsUtil.fetchMdmsData(requestInfo, "pg.citya.ward1", "TestModule", masterNameList);

        verify(restTemplate, times(1)).postForObject(anyString(), any(), eq(Map.class));
    }

    @Test
    void testFetchMdmsData_SingleMaster() {
        List<String> masterNameList = Collections.singletonList("SingleMaster");
        Map<String, Object> mockResponse = new HashMap<>();

        Map<String, Map<String, JSONArray>> mdmsRes = new HashMap<>();
        Map<String, JSONArray> moduleData = new HashMap<>();
        JSONArray data = new JSONArray();
        data.add("test-data");
        moduleData.put("SingleMaster", data);
        mdmsRes.put("TestModule", moduleData);

        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(mdmsRes);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(mockResponse);
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        Map<String, Map<String, JSONArray>> result = mdmsUtil.fetchMdmsData(requestInfo, "pg.citya", "TestModule", masterNameList);

        assertNotNull(result);
        assertTrue(result.containsKey("TestModule"));
        assertTrue(result.get("TestModule").containsKey("SingleMaster"));
        assertEquals(1, result.get("TestModule").get("SingleMaster").size());
    }

    @Test
    void testFetchMdmsData_VerifyUrlConstruction() {
        List<String> masterNameList = List.of("Master1");
        Map<String, Object> mockResponse = new HashMap<>();
        MdmsResponse mdmsResponse = new MdmsResponse();
        mdmsResponse.setMdmsRes(new HashMap<>());

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(mockResponse);
        when(mapper.convertValue(any(), eq(MdmsResponse.class))).thenReturn(mdmsResponse);

        mdmsUtil.fetchMdmsData(requestInfo, "pg.citya", "TestModule", masterNameList);

        verify(configs, times(1)).getMdmsHost();
        verify(configs, times(1)).getMdmsEndPoint();
    }
}
