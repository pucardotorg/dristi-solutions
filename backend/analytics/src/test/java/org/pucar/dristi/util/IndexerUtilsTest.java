package org.pucar.dristi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.service.UserService;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.pucar.dristi.web.models.Party;
import org.pucar.dristi.web.models.PendingTask;
import org.pucar.dristi.web.models.PendingTaskType;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Clock;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.*;

public class IndexerUtilsTest {

    @InjectMocks
    private org.pucar.dristi.util.IndexerUtils indexerUtils;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration config;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private UserService userService;

    @Mock
    private HearingUtil hearingUtil;

    @Mock
    private JsonUtil jsonUtil;

    @Mock
    private EvidenceUtil evidenceUtil;

    @Mock
    private TaskUtil taskUtil;

    @Mock
    private Clock clock;

    @Mock
    private ApplicationUtil applicationUtil;

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private MdmsDataConfig mdmsDataConfig;

    @Mock
    private CaseOverallStatusUtil caseOverallStatusUtil;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(indexerUtils, "mdmsDataConfig", mdmsDataConfig);
        when(clock.millis()).thenReturn(1000000000L); // Fixed mock time
    }

    private static PendingTask getPendingTask() {
        PendingTask pendingTask = new PendingTask();
        pendingTask.setId("id");
        pendingTask.setName("name");
        pendingTask.setEntityType("entityType");
        pendingTask.setReferenceId("referenceId");
        pendingTask.setStatus("status");
        pendingTask.setActionCategory("action");
        pendingTask.setStateSla(123L);
        pendingTask.setBusinessServiceSla(456L);
        pendingTask.setAssignedTo(List.of(new User()));
        pendingTask.setAssignedRole(List.of("role"));
        pendingTask.setIsCompleted(true);
        pendingTask.setCnrNumber("cnrNumber");
        pendingTask.setFilingNumber("filingNumber");
        pendingTask.setCaseId("caseId");
        pendingTask.setCaseTitle("caseTitle");
        pendingTask.setAdditionalDetails(Map.of("key", "value"));
        pendingTask.setCourtId("KLKM52");
        return pendingTask;
    }

    @Test
    public void testIsNullOrEmpty() {
        assertTrue(org.pucar.dristi.util.IndexerUtils.isNullOrEmpty(null));
        assertTrue(org.pucar.dristi.util.IndexerUtils.isNullOrEmpty(""));
        assertTrue(org.pucar.dristi.util.IndexerUtils.isNullOrEmpty(" "));
        assertFalse(org.pucar.dristi.util.IndexerUtils.isNullOrEmpty("test"));
    }

    @Test
    public void testGetESEncodedCredentials() {
        when(config.getEsUsername()).thenReturn("user");
        when(config.getEsPassword()).thenReturn("pass");

        String credentials = "user:pass";
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        String expected = "Basic " + new String(base64CredentialsBytes);

        String result = indexerUtils.getESEncodedCredentials();
        assertEquals(expected, result);
    }

    @Test
    public void testBuildString_NullException() {
        // Act
        assertThrows(NullPointerException.class, () -> indexerUtils.buildString(null));
    }

    @Test
    public void testBuildString_ValidObject() {
        // Arrange
        Object obj = "key1:value1,key2:value2";

        // Act
        String result = indexerUtils.buildString(obj);

        // Assert
        assertEquals("key1:value1,key2:value2", result);
    }

    @Test
    public void testEsPost_Success() {
        // Arrange
        String uri = "http://localhost:9200/_bulk";
        String request = "{\"index\":{}}";

        // Act
        indexerUtils.esPost(uri, request);

        // Assert
        verify(restTemplate, times(1)).postForObject(eq(uri), any(HttpEntity.class), eq(String.class));
    }

    @Test
    public void testEsPostManual_Success() throws Exception {
        // Arrange
        String uri = "http://localhost:9200/_bulk";
        String request = "{\"index\":{\"test\":\"test\"}}";
        String response = "{\"index\":{\"test\":\"test\"},\"errors\":\"false\"}";

        when(restTemplate.postForObject(eq(uri), any(HttpEntity.class), eq(String.class))).thenReturn(response);

        // Act
        indexerUtils.esPostManual(uri, request);

        // Assert
        verify(restTemplate, times(1)).postForObject(eq(uri), any(HttpEntity.class), eq(String.class));
    }

    @Test()
    public void testEsPostManual_Failure() {
        // Arrange
        String uri = "http://localhost:9200/_bulk";
        String request = "{\"index\":{}}";
        when(restTemplate.postForObject(anyString(), any(), any())).thenThrow(new RuntimeException());

        // Act
        assertThrows(RuntimeException.class, () -> indexerUtils.esPostManual(uri, request));

    }


    @Test
    public void testBuildPayloadWithPendingTask() throws Exception {
        // Arrange
        PendingTask pendingTask = getPendingTask();

        // Prepare mock representative advocate
        AdvocateMapping representative = AdvocateMapping.builder().build();
        Party party = Party.builder().partyType("complainant.primary").build();
        representative.setRepresenting(List.of(party));
        representative.setAdditionalDetails(Map.of("advocateName", "John Doe"));

        // Mock conversion of representative
        when(mapper.convertValue(any(), any(TypeReference.class)))
                .thenReturn(List.of(representative));

        // Mock nested value extraction
        when(jsonUtil.getNestedValue(any(), eq(List.of("advocateName")), eq(String.class)))
                .thenReturn("John Doe");

        // Mock writing AdvocateDetail as JSON
        when(mapper.writeValueAsString(argThat(arg -> arg instanceof AdvocateDetail)))
                .thenReturn("{\"complainant\":[\"John Doe\"]}");

        // Mock writing other objects
        when(mapper.writeValueAsString(argThat(arg -> !(arg instanceof AdvocateDetail))))
                .thenReturn("{\"key\":\"value\"}");

        // Mock case response
        String mockCaseJson = """
          [  {
              "cmpNumber": "CMP-123",
              "courtCaseNumber": "COURT-456",
              "substage": "HEARING",
              "representatives": [
                {
                  "additionalDetails": {
                    "advocateName": "John Doe"
                  },
                  "representing": [
                    {
                      "partyType": "complainant.primary"
                    }
                  ]
                }
              ]
            }]
            """;
        JsonNode mockCaseJsonNode = new ObjectMapper().readTree(mockCaseJson);

        when(caseUtil.searchCaseDetails(any())).thenReturn(mockCaseJsonNode);

        // Mock config
        when(config.getIndex()).thenReturn("index");

        // Mock clock time
        when(clock.millis()).thenReturn(1000000000L);

        // Act
        String result = indexerUtils.buildPayload(pendingTask);

        // Expected output string
        String expected = String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_DOCUMENT_FORMAT,
                "index", "referenceId", "id", "name", "entityType", "referenceId", "status",
                "COURT-456", "HEARING", "{\"complainant\":[\"John Doe\"]}", "action",
                "[\"COURT-456\",\"caseTitle\",\"John Doe\"]", "[null]", "[\"role\"]", "cnrNumber",
                "filingNumber", "caseId", "caseTitle", true, 123L, 456L,
                "{\"key\":\"value\"}", null, null, 1000000000, null
        );

        // Assert
        assertEquals(expected, result);
    }


    @Test
    public void testBuildPayloadWithJsonString() throws Exception {
        String jsonItem = "{"
                + "\"id\": \"id\","
                + "\"businessService\": \"entityType\","
                + "\"businessId\": \"referenceId\","
                + "\"state\": {\"state\":\"status\"," +
                " \"actions\":[{\"roles\" : [\"role1\", \"role2\"]}]},"
                + "\"stateSla\": 86400,"
                + "\"businesssServiceSla\": 456,"
                + "\"assignes\": [\"user1\"],"
                + "\"assignedRoles\": [\"role1\", \"role2\"],"
                + "\"tenantId\": \"tenantId\","
                + "\"action\": \"action\","
                + "\"additionalDetails\" : {\"key\":\"value\", \"excludeRoles\":[\"role2\"]}," +
                "\"courtId\":\"null\""
                + "}";
        JSONObject requestInfo = new JSONObject();


        when(config.getIndex()).thenReturn("index");
        when(caseOverallStatusUtil.checkCaseOverAllStatus(anyString(), anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new Object());

        AdvocateMapping representative = AdvocateMapping.builder().build();
        Party party = Party.builder().partyType("complainant.primary").build();
        representative.setRepresenting(List.of(party));
        representative.setAdditionalDetails(Map.of("advocateName", "John Doe"));

        when(mapper.convertValue(any(), eq(new TypeReference<List<AdvocateMapping>>() {
        })))
                .thenReturn(List.of(representative));
        when(jsonUtil.getNestedValue(any(), eq(List.of("advocateName")), eq(String.class)))
                .thenReturn("John Doe");

        when(mapper.writeValueAsString(argThat(arg -> !(arg instanceof AdvocateUtil))))
                .thenReturn("{\"complainant\":[\"John Doe\"]}");

        when(mapper.convertValue(anyString(), eq(String.class))).thenReturn("{\"key\":\"value\"}");
        String mockCaseJson = """
               [ {
                  "cmpNumber": "CMP-123",
                  "courtCaseNumber": "COURT-456",
                  "substage": "HEARING",
                  "representatives": [
                    {
                      "additionalDetails": {
                        "advocateName": "John Doe"
                      },
                      "representing": [
                        {
                          "partyType": "complainant.primary"
                        }
                      ]
                    }
                  ]
                }]
                """;

        RequestInfo mockRequestInfo = new RequestInfo();
        mockRequestInfo.setUserInfo(new User());
// set any fields in mockRequestInfo if needed

        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(mockRequestInfo);

        JsonNode mockCaseJsonNode = new ObjectMapper().readTree(mockCaseJson);
        when(caseUtil.searchCaseDetails(any())).thenReturn(mockCaseJsonNode);

        String expected = String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_DOCUMENT_FORMAT,
                "index", "referenceId", "id", "name", "entityType", "referenceId", "status", null,null,"{}","null",null,"[\"user1\"]", "[\"role1\",\"role2\"]", "null", "null", "null","null",false, ONE_DAY_DURATION_MILLIS+1000000000L, 456L, "{\"complainant\":[\"John Doe\"]}", null,null,1000000000, null
        );

        PendingTaskType pendingTaskType = PendingTaskType.builder().isgeneric(false).pendingTask("name").state("status").triggerAction(List.of("action")).build();
        Map<String, List<PendingTaskType>> map = new HashMap<>();
        map.put("entityType", List.of(pendingTaskType));
        when(mdmsDataConfig.getPendingTaskTypeMap()).thenReturn(map);

        String result = indexerUtils.buildPayload(jsonItem, requestInfo);
        assertEquals(expected, result);
    }

    @Test
    public void testEsPost_ResourceAccessException() {
        // Arrange
        String uri = "http://localhost:9200/_bulk";
        String request = "{\"index\":{}}";
        when(restTemplate.postForObject(eq(uri), any(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

        // We need to mock the orchestrateListenerOnESHealth method to avoid actually running it
        IndexerUtils spyIndexerUtils = spy(indexerUtils);
        doNothing().when(spyIndexerUtils).orchestrateListenerOnESHealth();

        // Act
        spyIndexerUtils.esPost(uri, request);

        // Assert
        verify(restTemplate, times(1)).postForObject(eq(uri), any(), eq(String.class));
        verify(spyIndexerUtils, times(1)).orchestrateListenerOnESHealth();
    }

    @Test
    public void testEsPost_Success_1() {
        // Arrange
        String uri = "http://localhost:9200/_bulk";
        String request = "{\"index\":{}}";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        headers.add("Authorization", "Basic bnVsbDpudWxs");
        HttpEntity<String> entity = new HttpEntity<>(request, headers);
        when(restTemplate.postForObject(uri, entity, String.class)).thenReturn("{\"errors\":true}");

        // Act
        indexerUtils.esPost(uri, request);

        // Assert
        verify(restTemplate, times(1)).postForObject(eq(uri), any(HttpEntity.class), eq(String.class));
    }
}
