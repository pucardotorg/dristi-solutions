package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HrmsUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration configs;

    @InjectMocks
    private HrmsUtil hrmsUtil;

    private ObjectMapper objectMapper;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        User user = User.builder().uuid("test-uuid").tenantId("kl").build();
        requestInfo = RequestInfo.builder().userInfo(user).build();
    }

    @Test
    void getJudgeForCourtroom_NullCourtroom_ReturnsNull() {
        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, null);
        assertNull(result);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void getJudgeForCourtroom_EmptyCourtroom_ReturnsNull() {
        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "   ");
        assertNull(result);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void getJudgeForCourtroom_NullResponse_ReturnsNull() {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(null);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }

    @Test
    void getJudgeForCourtroom_NoEmployeesInResponse_ReturnsNull() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        JsonNode response = objectMapper.readTree("{\"ResponseInfo\": {}}");
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }

    @Test
    void getJudgeForCourtroom_EmptyEmployeesArray_ReturnsNull() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        JsonNode response = objectMapper.readTree("{\"Employees\": []}");
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }

    @Test
    void getJudgeForCourtroom_ValidJudgeFound_ReturnsEmployee() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        long currentTime = System.currentTimeMillis();
        String jsonResponse = String.format("""
            {
                "Employees": [{
                    "code": "devJudge",
                    "uuid": "test-uuid-123",
                    "assignments": [{
                        "courtroom": "KLKM52",
                        "fromDate": %d,
                        "toDate": null
                    }]
                }]
            }
            """, currentTime - 86400000); // fromDate is 1 day ago
        
        JsonNode response = objectMapper.readTree(jsonResponse);
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        
        assertNotNull(result);
        assertEquals("devJudge", result.get("code").textValue());
    }

    @Test
    void getJudgeForCourtroom_JudgeWithExpiredAssignment_ReturnsNull() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        long currentTime = System.currentTimeMillis();
        String jsonResponse = String.format("""
            {
                "Employees": [{
                    "code": "expiredJudge",
                    "assignments": [{
                        "courtroom": "KLKM52",
                        "fromDate": %d,
                        "toDate": %d
                    }]
                }]
            }
            """, currentTime - 172800000, currentTime - 86400000); // Both dates in past
        
        JsonNode response = objectMapper.readTree(jsonResponse);
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }

    @Test
    void getJudgeForCourtroom_JudgeWithFutureAssignment_ReturnsNull() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        long currentTime = System.currentTimeMillis();
        String jsonResponse = String.format("""
            {
                "Employees": [{
                    "code": "futureJudge",
                    "assignments": [{
                        "courtroom": "KLKM52",
                        "fromDate": %d,
                        "toDate": null
                    }]
                }]
            }
            """, currentTime + 86400000); // fromDate is 1 day in future
        
        JsonNode response = objectMapper.readTree(jsonResponse);
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }

    @Test
    void getJudgeForCourtroom_DifferentCourtroom_ReturnsNull() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        long currentTime = System.currentTimeMillis();
        String jsonResponse = String.format("""
            {
                "Employees": [{
                    "code": "otherJudge",
                    "assignments": [{
                        "courtroom": "KLKM53",
                        "fromDate": %d,
                        "toDate": null
                    }]
                }]
            }
            """, currentTime - 86400000);
        
        JsonNode response = objectMapper.readTree(jsonResponse);
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }

    @Test
    void getJudgeForCourtroom_ExceptionThrown_ThrowsCustomException() {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class)))
            .thenThrow(new RuntimeException("Connection failed"));

        assertThrows(CustomException.class, () -> 
            hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52"));
    }

    @Test
    void getJudgeForCourtroom_NoAssignments_ReturnsNull() throws Exception {
        when(configs.getHrmsHost()).thenReturn("http://localhost:8080");
        when(configs.getHrmsSearchEndpoint()).thenReturn("/egov-hrms/employees/_search");
        
        String jsonResponse = """
            {
                "Employees": [{
                    "code": "noAssignmentJudge",
                    "assignments": null
                }]
            }
            """;
        
        JsonNode response = objectMapper.readTree(jsonResponse);
        when(restTemplate.postForObject(anyString(), any(), eq(JsonNode.class))).thenReturn(response);

        JsonNode result = hrmsUtil.getJudgeForCourtroom(requestInfo, "KLKM52");
        assertNull(result);
    }
}
