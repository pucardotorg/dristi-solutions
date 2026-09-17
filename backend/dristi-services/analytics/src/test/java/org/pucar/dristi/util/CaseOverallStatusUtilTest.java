package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.util.CaseOverallStatusUtil;
import org.pucar.dristi.util.HearingUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.CaseOutcome;
import org.pucar.dristi.web.models.CaseOutcomeType;
import org.pucar.dristi.web.models.CaseOverallStatusType;
import org.pucar.dristi.web.models.CaseStageSubStage;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.service.SmsNotificationService;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CaseOverallStatusUtilTest {

    @Mock
    private Configuration config;

    @Mock
    private HearingUtil hearingUtil;

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private Producer producer;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private MdmsDataConfig mdmsDataConfig;

    @Mock
    private Util util;

    @Mock
    private CaseStageTrackingUtil caseStageTrackingUtil;

    @Mock
    private SecondaryStageProcessor secondaryStageProcessor;

    @Mock
    private ApplicationUtil applicationUtil;

    @Mock
    private AdvocateUtil advocateUtil;

    @Mock
    private IndividualService individualService;

    @Mock
    private SmsNotificationService notificationService;

    @InjectMocks
    private CaseOverallStatusUtil caseOverallStatusUtil;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testMoveCaseToLPR_TransitionsStageInES() throws Exception {
        String entityType = "order";
        String referenceId = "lpr-to-123";
        String status = "published";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-LPR-TO");
        orderObject.put("orderCategory", "normal");
        orderObject.put("orderType", "MOVE_CASE_TO_LONG_PENDING_REGISTER");

        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("order", List.of(
                CaseOverallStatusType.builder()
                        .entityType("ORDER")
                        .typeIdentifier("MOVE_CASE_TO_LONG_PENDING_REGISTER")
                        .state(status)
                        .stage("Long Pending Register")
                        .priority(1)
                        .build()
        ));

        Map<String, CaseOutcomeType> caseOutcomeTypeMap = new HashMap<>();

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Cognizance");
        caseObj.put("id", "case-id-1");
        caseObj.put("courtId", "court-1");

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(config.getCaseOutcomeTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(mdmsDataConfig.getCaseOutcomeTypeMap()).thenReturn(caseOutcomeTypeMap);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNotNull(result);
    }

    @Test
    void testMoveCaseOutOfLPR_RestoresHighestPriorityStage() throws Exception {
        String entityType = "order";
        String referenceId = "lpr-out-123";
        String status = "published";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-LPR-OUT");
        orderObject.put("orderCategory", "normal");
        orderObject.put("orderType", "MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER");

        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("order", List.of(
                CaseOverallStatusType.builder()
                        .entityType("ORDER")
                        .typeIdentifier("MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER")
                        .state(status)
                        .stage("Cognizance")
                        .priority(3)
                        .build()
        ));

        Map<String, CaseOutcomeType> caseOutcomeTypeMap = new HashMap<>();

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Long Pending Register");
        caseObj.put("id", "case-id-2");
        caseObj.put("courtId", "court-1");

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(config.getCaseOutcomeTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(mdmsDataConfig.getCaseOutcomeTypeMap()).thenReturn(caseOutcomeTypeMap);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNotNull(result);
        // Verify move-out-of-LPR transition uses the priority map stage ("Cognizance") as restored stage
        verify(caseStageTrackingUtil).transitionStage(eq("FN-LPR-OUT"), eq("case-id-2"), eq(tenantId), eq("Long Pending Register"), eq("Cognizance"));
    }

    @Test
    void testCompositeLPRMoveTo_TransitionsForEachItem() throws Exception {
        String entityType = "order";
        String referenceId = "composite-lpr-123";
        String status = "published";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-COMP-LPR");
        orderObject.put("orderCategory", "composite");

        JSONArray compositeItems = new JSONArray();
        JSONObject item1 = new JSONObject();
        item1.put("orderType", "MOVE_CASE_TO_LONG_PENDING_REGISTER");
        JSONObject item2 = new JSONObject();
        item2.put("orderType", "NOTICE");
        compositeItems.put(item1);
        compositeItems.put(item2);

        orderObject.put("compositeItems", compositeItems);

        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("order", List.of(
                CaseOverallStatusType.builder()
                        .entityType("ORDER")
                        .typeIdentifier("MOVE_CASE_TO_LONG_PENDING_REGISTER")
                        .state(status)
                        .stage("Long Pending Register")
                        .priority(1)
                        .build(),
                CaseOverallStatusType.builder()
                        .entityType("ORDER")
                        .typeIdentifier("NOTICE")
                        .state(status)
                        .stage("Pre-Trial")
                        .priority(5)
                        .build()
        ));

        Map<String, CaseOutcomeType> caseOutcomeTypeMap = new HashMap<>();

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Cognizance");
        caseObj.put("id", "case-id-3");
        caseObj.put("courtId", "court-1");

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(config.getCaseOutcomeTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(mdmsDataConfig.getCaseOutcomeTypeMap()).thenReturn(caseOutcomeTypeMap);
        when(util.constructArray(orderObject.toString(), "$.compositeItems.*")).thenReturn(compositeItems);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNotNull(result);
        // Verify LPR move-to transition was called for the first composite item
        verify(caseStageTrackingUtil).transitionStage(eq("FN-COMP-LPR"), eq("case-id-3"), eq(tenantId), eq("Cognizance"), eq("Long Pending Register"));
    }

    @Test
    void testOrderProcessing_CaseObjectNull_ReturnsNull() throws Exception {
        String entityType = "order";
        String referenceId = "null-case-123";
        String status = "published";
        String tenantId = "tenant1";

        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-NULL-CASE");
        orderObject.put("orderCategory", "normal");
        orderObject.put("orderType", "WITHDRAWAL");

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(null);
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(new HashMap<>());

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        // When caseObject is null, processOrderOverallStatus returns null
        assertNull(result);
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testSummonsOrder_AccusedNotJoined_SetsAppearanceStage() throws Exception {
        String entityType = "order";
        String referenceId = "summons-123";
        String status = "published";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-SUMMONS");
        orderObject.put("orderCategory", "normal");
        orderObject.put("orderType", "Summons");

        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("order", List.of(
                CaseOverallStatusType.builder()
                        .entityType("ORDER")
                        .typeIdentifier("Summons")
                        .state(status)
                        .stage("Pre-Trial")
                        .priority(5)
                        .build()
        ));

        Map<String, CaseOutcomeType> caseOutcomeTypeMap = new HashMap<>();

        // Case with no accused litigants
        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Cognizance");
        caseObj.put("id", "case-id-summons");
        caseObj.put("courtId", "court-1");
        caseObj.put("litigants", new JSONArray());

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(config.getCaseOutcomeTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(mdmsDataConfig.getCaseOutcomeTypeMap()).thenReturn(caseOutcomeTypeMap);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNotNull(result);
        // For Summons with no accused joined, should publish with Appearance stage and transition from Cognizance
        verify(caseStageTrackingUtil).transitionStage(eq("FN-SUMMONS"), eq("case-id-summons"), eq(tenantId), eq("Cognizance"), eq("Appearance"));
    }

    @Test
    void testSummonsOrder_AccusedJoined_UsesConfigStage() throws Exception {
        String entityType = "order";
        String referenceId = "summons-joined-123";
        String status = "published";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-SUMMONS-JOINED");
        orderObject.put("orderCategory", "normal");
        orderObject.put("orderType", "Summons");

        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("order", List.of(
                CaseOverallStatusType.builder()
                        .entityType("ORDER")
                        .typeIdentifier("Summons")
                        .state(status)
                        .stage("Pre-Trial")
                        .priority(5)
                        .build()
        ));

        Map<String, CaseOutcomeType> caseOutcomeTypeMap = new HashMap<>();

        // Case with accused litigant joined
        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Cognizance");
        caseObj.put("id", "case-id-joined");
        caseObj.put("courtId", "court-1");
        JSONArray litigants = new JSONArray();
        JSONObject accusedLitigant = new JSONObject();
        accusedLitigant.put("partyType", "respondent.primary");
        litigants.put(accusedLitigant);
        caseObj.put("litigants", litigants);

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(config.getCaseOutcomeTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(mdmsDataConfig.getCaseOutcomeTypeMap()).thenReturn(caseOutcomeTypeMap);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNotNull(result);
    }

    @Test
    void testProcessJoinCaseStageUpdate_AppearanceToBailTransition() throws Exception {
        Map<String, Object> joinCaseJson = new HashMap<>();
        joinCaseJson.put("filingNumber", "FN-JOIN-123");
        joinCaseJson.put("tenantId", "tenant1");

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo ri = new RequestInfo();
        ri.setUserInfo(user);
        joinCaseJson.put("RequestInfo", ri);

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Appearance");
        caseObj.put("id", "case-id-join");
        caseObj.put("courtId", "court-1");
        JSONArray litigants = new JSONArray();
        JSONObject accusedLitigant = new JSONObject();
        accusedLitigant.put("partyType", "respondent.primary");
        litigants.put(accusedLitigant);
        caseObj.put("litigants", litigants);

        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(mapper.writeValueAsString(any())).thenReturn("{}");
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(ri);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");

        caseOverallStatusUtil.processJoinCaseStageUpdate(joinCaseJson);

        // Verify transition from Appearance to Bail & Recording of Plea
        verify(caseStageTrackingUtil).transitionStage(eq("FN-JOIN-123"), eq("case-id-join"), eq("tenant1"), eq("Appearance"), eq("Bail & Recording of Plea"));
        // Verify stage was published
        verify(producer).push(eq("topic"), any(CaseStageSubStage.class));
    }

    @Test
    void testProcessJoinCaseStageUpdate_NotInAppearance_NoTransition() throws Exception {
        Map<String, Object> joinCaseJson = new HashMap<>();
        joinCaseJson.put("filingNumber", "FN-JOIN-456");
        joinCaseJson.put("tenantId", "tenant1");

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo ri = new RequestInfo();
        ri.setUserInfo(user);
        joinCaseJson.put("RequestInfo", ri);

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Cognizance");
        caseObj.put("id", "case-id-join-2");
        caseObj.put("courtId", "court-1");
        JSONArray litigants = new JSONArray();
        JSONObject accusedLitigant = new JSONObject();
        accusedLitigant.put("partyType", "respondent.primary");
        litigants.put(accusedLitigant);
        caseObj.put("litigants", litigants);

        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(mapper.writeValueAsString(any())).thenReturn("{}");
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(ri);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);

        caseOverallStatusUtil.processJoinCaseStageUpdate(joinCaseJson);

        // No stage transition when not in Appearance
        verify(caseStageTrackingUtil, never()).transitionStage(anyString(), anyString(), anyString(), eq("Appearance"), anyString());
        verify(producer, never()).push(anyString(), any(CaseStageSubStage.class));
    }

    @Test
    void testProcessJoinCaseStageUpdate_NullFilingNumber_Skips() throws Exception {
        Map<String, Object> joinCaseJson = new HashMap<>();
        // No filingNumber

        caseOverallStatusUtil.processJoinCaseStageUpdate(joinCaseJson);

        // Should skip entirely - no calls to caseUtil
        verify(caseUtil, never()).getCase(any(), any(), any(), any(), any());
    }

    @Test
    void testProcessJoinCaseStageUpdate_CaseObjectNull_Skips() throws Exception {
        Map<String, Object> joinCaseJson = new HashMap<>();
        joinCaseJson.put("filingNumber", "FN-NULL-CASE");
        joinCaseJson.put("tenantId", "tenant1");

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo ri = new RequestInfo();
        ri.setUserInfo(user);
        joinCaseJson.put("RequestInfo", ri);

        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(mapper.writeValueAsString(any())).thenReturn("{}");
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(ri);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(null);

        caseOverallStatusUtil.processJoinCaseStageUpdate(joinCaseJson);

        // No transition when case is null
        verify(caseStageTrackingUtil, never()).transitionStage(any(), any(), any(), any(), any());
    }

    @Test
    void testMoveCaseOutOfLPR_NoPriorityMapStage_UsesCaseStage() throws Exception {
        String entityType = "order";
        String referenceId = "lpr-out-nomap";
        String status = "published";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject orderObject = new JSONObject();
        orderObject.put("filingNumber", "FN-LPR-NOMAP");
        orderObject.put("orderCategory", "normal");
        orderObject.put("orderType", "MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER");

        // No matching MDMS config, so priority map stays empty
        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("order", List.of());

        Map<String, CaseOutcomeType> caseOutcomeTypeMap = new HashMap<>();

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Long Pending Register");
        caseObj.put("id", "case-id-nomap");
        caseObj.put("courtId", "court-1");

        when(config.getOrderBusinessServiceList()).thenReturn(List.of("order"));
        when(config.getApiCallDelayInSeconds()).thenReturn(0);
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(orderUtil.getOrder(any(), eq(referenceId), any())).thenReturn(orderObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(config.getCaseOutcomeTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(mdmsDataConfig.getCaseOutcomeTypeMap()).thenReturn(caseOutcomeTypeMap);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNotNull(result);
        // When no priority map entry and caseOverallStatus is null, falls back to case stage
        verify(caseStageTrackingUtil).transitionStage(eq("FN-LPR-NOMAP"), eq("case-id-nomap"), eq(tenantId), eq("Long Pending Register"), eq("Long Pending Register"));
    }

    @Test
    void testCaseRegistration_CognizanceStage_TriggersSecondaryStage() throws Exception {
        String entityType = "case";
        String referenceId = "FN-COG-123";
        String status = "pending_registration";
        String action = "register";
        String tenantId = "tenant1";

        User user = new User();
        user.setUuid("uuid-123");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        JSONObject requestInfoJson = new JSONObject();

        Map<String, List<CaseOverallStatusType>> caseOverallStatusTypeMap = new HashMap<>();
        caseOverallStatusTypeMap.put("case", List.of(
                CaseOverallStatusType.builder()
                        .action(action)
                        .state(status)
                        .stage("Cognizance")
                        .build()
        ));

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Registration");
        caseObj.put("id", "case-id-cog");
        caseObj.put("courtId", "court-1");

        when(config.getCaseBusinessServiceList()).thenReturn(List.of("case"));
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(mapper.readValue(anyString(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(config.getCaseOverallStatusTopic()).thenReturn("topic");
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(caseOverallStatusTypeMap);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, action, tenantId, requestInfoJson);

        assertNotNull(result);
        // Cognizance stage should trigger secondary stage processing for delay condonation
        verify(secondaryStageProcessor).processCaseRegistrationSecondaryStage(eq(referenceId), eq(tenantId), eq(caseObj), any());
    }

    @Test
    void testApplicationBusinessService_DelegatesCorrectly() throws Exception {
        String entityType = "application";
        String referenceId = "app-123";
        String status = "COMPLETED";
        String action = "approve";
        String tenantId = "tenant1";

        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        JSONObject appObject = new JSONObject();
        appObject.put("filingNumber", "FN-APP");
        appObject.put("applicationType", "DELAY_CONDONATION");

        JSONObject caseObj = new JSONObject();
        caseObj.put("stage", "Cognizance");

        when(config.getApplicationBusinessServiceList()).thenReturn(List.of("application"));
        when(config.getStateLevelTenantId()).thenReturn("pg");
        when(applicationUtil.getApplication(any(), any(), eq(referenceId))).thenReturn(appObject);
        when(caseUtil.getCase(any(), any(), any(), any(), any())).thenReturn(caseObj);
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(new HashMap<>());

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, action, tenantId, requestInfoJson);

        assertNotNull(result);
        verify(secondaryStageProcessor).processApplicationSecondaryStage(eq("FN-APP"), eq(tenantId), eq("DELAY_CONDONATION"), eq(status), any(), eq(caseObj));
    }

    @Test
    void testTaskBusinessService_EndTrigger() throws Exception {
        String entityType = "task";
        String referenceId = "task-123";
        String status = "EXECUTED";
        String tenantId = "tenant1";

        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        when(config.getTaskBusinessServiceList()).thenReturn(List.of("task"));
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(new HashMap<>());

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNull(result);
        verify(secondaryStageProcessor).processTaskEndTrigger(eq(referenceId), eq(tenantId), eq("task"), any());
    }

    @Test
    void testTaskNoticeEntityType_DelegatesToTaskProcessing() throws Exception {
        String entityType = "task-notice";
        String referenceId = "task-notice-123";
        String status = "DELIVERED";
        String tenantId = "tenant1";

        JSONObject requestInfoJson = new JSONObject();
        requestInfoJson.put("RequestInfo", new JSONObject());

        when(config.getTaskBusinessServiceList()).thenReturn(List.of("task"));
        when(mdmsDataConfig.getCaseOverallStatusTypeMap()).thenReturn(new HashMap<>());

        Object result = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, null, tenantId, requestInfoJson);

        assertNull(result);
        verify(secondaryStageProcessor).processTaskEndTrigger(eq(referenceId), eq(tenantId), eq("task-notice"), any());
    }
}