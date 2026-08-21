package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.DemandUtil;
import org.pucar.dristi.util.JsonUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.util.PendingTaskUtil;
import org.pucar.dristi.web.models.Task;
import org.pucar.dristi.web.models.TaskRequest;
import org.pucar.dristi.web.models.order.Order;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WarrantReissueServiceTest {

    // Real mapper - the service does its own JSON walking, so a mock would defeat the test.
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private TaskService taskService;
    @Mock private Configuration config;
    @Mock private Producer producer;
    @Mock private UserService userService;
    @Mock private OrderUtil orderUtil;
    @Mock private PendingTaskUtil pendingTaskUtil;
    @Mock private CaseUtil caseUtil;
    @Mock private AdvocateUtil advocateUtil;
    @Mock private JsonUtil jsonUtil;
    @Mock private DemandUtil demandUtil;
    @Mock private MdmsUtil mdmsUtil;

    private WarrantReissueService service;

    private static final String ORDER_ID = "31a1567b-0477-40c6-aa93-fb3bdb692cf2";
    private static final String UNIQUE_ID = "36bfb913-00db-43d7-8c75-49c4d05ea093";
    private static final String ADDRESS_ID = "ae19d9af-72e2-4420-a628-354ad5151bab";
    private static final String POLICE_KEY = UNIQUE_ID + "|" + ADDRESS_ID + "|police";
    private static final String RPAD_KEY = UNIQUE_ID + "|" + ADDRESS_ID + "|rpad";

    // A single warrant taskDetail object (the same shape stored on a created warrant task), used
    // both inside the composite order's taskDetails array and as a standalone task's taskDetails.
    private static String warrantTaskDetail(String channelCode, String channelName) {
        return "{"
                + "\"respondentDetails\":{\"name\":\"Accused Details\","
                + "\"address\":{\"id\":\"" + ADDRESS_ID + "\",\"city\":\"city\"},"
                + "\"uniqueId\":\"" + UNIQUE_ID + "\"},"
                + "\"deliveryChannels\":{\"channelName\":\"" + channelName + "\",\"channelCode\":\"" + channelCode + "\"}"
                + "}";
    }

    // Mirrors the real composite order: a SCHEDULE_OF_HEARING_DATE item plus a WARRANT item whose
    // additionalDetails.taskDetails is a JSON *string* holding an array of two warrant task details
    // (POLICE + RPAD) for the same accused/address.
    private Order compositeOrderWithWarrant() throws Exception {
        String taskDetailsJsonString = "["
                + warrantTaskDetail("POLICE", "Police") + ","
                + warrantTaskDetail("RPAD", "RPAD")
                + "]";
        // taskDetails is carried as a string, so embed it as an escaped JSON string literal
        String escaped = objectMapper.writeValueAsString(taskDetailsJsonString);
        String compositeItemsJson = "["
                + "{\"id\":\"82c5ea56\",\"orderType\":\"SCHEDULE_OF_HEARING_DATE\",\"orderSchema\":{"
                + "\"orderType\":\"SCHEDULE_OF_HEARING_DATE\",\"additionalDetails\":{\"formdata\":{}}}},"
                + "{\"id\":\"7e7a27b9\",\"orderType\":\"WARRANT\",\"orderSchema\":{"
                + "\"orderType\":\"WARRANT\",\"additionalDetails\":{\"formdata\":{},\"taskDetails\":" + escaped + "}}}"
                + "]";

        Order order = new Order();
        order.setId(java.util.UUID.fromString(ORDER_ID));
        order.setOrderCategory("COMPOSITE");
        order.setCompositeItems(objectMapper.readValue(compositeItemsJson, Object.class));
        return order;
    }

    // A standalone WARRANT order (orderCategory INTERMEDIATE, orderType WARRANT) that also schedules
    // the next hearing: it authors its warrant(s) on its own additionalDetails.taskDetails (the same
    // JSON-string array shape a composite WARRANT item carries), with no composite wrapper.
    private Order standaloneWarrantOrder() throws Exception {
        String taskDetailsJsonString = "["
                + warrantTaskDetail("POLICE", "Police") + ","
                + warrantTaskDetail("RPAD", "RPAD")
                + "]";
        String escaped = objectMapper.writeValueAsString(taskDetailsJsonString);
        String additionalDetailsJson = "{\"formdata\":{},\"taskDetails\":" + escaped + "}";

        Order order = new Order();
        order.setId(java.util.UUID.fromString(ORDER_ID));
        order.setOrderCategory("INTERMEDIATE");
        order.setOrderType("WARRANT");
        order.setNextHearingDate(1784745000000L);
        order.setAdditionalDetails(objectMapper.readValue(additionalDetailsJson, Object.class));
        return order;
    }

    @BeforeEach
    void setUp() {
        service = new WarrantReissueService(taskService, config, producer, objectMapper, userService,
                orderUtil, pendingTaskUtil, caseUtil, advocateUtil, jsonUtil, demandUtil, mdmsUtil);
    }

    @Test
    void collectSchedulingOrderWarrantCoverageKeys_extractsPartyAddressChannelKeysFromWarrantItem() throws Exception {
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(compositeOrderWithWarrant());

        Set<String> keys = service.collectSchedulingOrderWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

        assertEquals(2, keys.size(), "expected one key per delivery channel");
        assertTrue(keys.contains(POLICE_KEY), "should cover the POLICE warrant");
        assertTrue(keys.contains(RPAD_KEY), "should cover the RPAD warrant");
    }

    @Test
    void buildWarrantCoverageKey_matchesCompositeCoverageForSamePartyAddressChannel() throws Exception {
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(compositeOrderWithWarrant());
        Set<String> coverage = service.collectSchedulingOrderWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

        // A previous-cycle warrant task for the same accused via POLICE produces an identical key,
        // so the reissue flow would skip it (composite order takes priority).
        Task policeWarrant = new Task();
        policeWarrant.setTaskNumber("W-1");
        policeWarrant.setTaskDetails(objectMapper.readValue(warrantTaskDetail("POLICE", "Police"), Object.class));

        String key = service.buildWarrantCoverageKey(policeWarrant);
        assertEquals(POLICE_KEY, key);
        assertTrue(coverage.contains(key), "matching warrant must be covered by the composite order");
    }

    @Test
    void buildWarrantCoverageKey_doesNotMatchDifferentChannel() throws Exception {
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(compositeOrderWithWarrant());
        Set<String> coverage = service.collectSchedulingOrderWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

        // Same party/address but a channel the composite warrant does not cover -> not skipped.
        Task emailWarrant = new Task();
        emailWarrant.setTaskNumber("W-2");
        emailWarrant.setTaskDetails(objectMapper.readValue(warrantTaskDetail("EMAIL", "Email"), Object.class));

        String key = service.buildWarrantCoverageKey(emailWarrant);
        assertEquals(UNIQUE_ID + "|" + ADDRESS_ID + "|email", key);
        assertTrue(!coverage.contains(key), "non-matching channel must not be covered");
    }

    @Test
    void collectSchedulingOrderWarrantCoverageKeys_extractsKeysFromStandaloneWarrantOrder() throws Exception {
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(standaloneWarrantOrder());

        Set<String> keys = service.collectSchedulingOrderWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

        // A non-composite WARRANT order that also schedules the hearing must be covered exactly like a
        // composite WARRANT item, so its own freshly authored warrants are not duplicated by a reissue.
        assertEquals(2, keys.size(), "expected one key per delivery channel");
        assertTrue(keys.contains(POLICE_KEY), "should cover the POLICE warrant");
        assertTrue(keys.contains(RPAD_KEY), "should cover the RPAD warrant");
    }

    @Test
    void collectSchedulingOrderWarrantCoverageKeys_returnsEmptyForIntermediateNonWarrantOrder() {
        // An INTERMEDIATE order that is not a WARRANT order (and authors no warrant) yields no keys.
        Order intermediate = new Order();
        intermediate.setOrderCategory("INTERMEDIATE");
        intermediate.setOrderType("SCHEDULE_OF_HEARING_DATE");
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(intermediate);

        Set<String> keys = service.collectSchedulingOrderWarrantCoverageKeys(new RequestInfo(), ORDER_ID);
        assertTrue(keys.isEmpty());
    }

    @Test
    void collectSchedulingOrderWarrantCoverageKeys_returnsEmptyForNullOrderId() {
        Set<String> keys = service.collectSchedulingOrderWarrantCoverageKeys(new RequestInfo(), null);
        assertTrue(keys.isEmpty());
    }

    @Test
    void buildWarrantCoverageKey_returnsNullWhenNoTaskDetails() {
        Task warrant = new Task();
        warrant.setTaskNumber("W-3");
        assertNull(service.buildWarrantCoverageKey(warrant));
    }

    // ---- issue #5930: auto-reissue applies only to the iCoPS channel ----

    private static final Long PREVIOUS_HEARING_DATE = 1_000_000_000_000L;
    private static final Long NEW_HEARING_DATE = 2_000_000_000_000L;

    // A stored warrant task tagged to PREVIOUS_HEARING_DATE, on the given delivery channel and status.
    private Task warrantOnChannel(String taskNumber, String channelCode, String status) {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTaskNumber(taskNumber);
        task.setTaskType("WARRANT");
        task.setStatus(status);
        ObjectNode taskDetails = objectMapper.createObjectNode();
        ObjectNode deliveryChannels = objectMapper.createObjectNode();
        deliveryChannels.put("channelCode", channelCode);
        deliveryChannels.put("channelName", channelCode);
        taskDetails.set("deliveryChannels", deliveryChannels);
        ObjectNode caseDetails = objectMapper.createObjectNode();
        caseDetails.put("hearingDate", PREVIOUS_HEARING_DATE);
        taskDetails.set("caseDetails", caseDetails);
        task.setTaskDetails(taskDetails);
        return task;
    }

    @Test
    void handleHearingRescheduled_reissuesIcopsWarrantInPlace() {
        when(userService.createInternalMicroserviceRequestInfo()).thenReturn(new RequestInfo());
        when(taskService.searchTask(any()))
                .thenReturn(List.of(warrantOnChannel("W-ICOPS", "POLICE", "ISSUE_WARRANT")));

        service.handleHearingRescheduled(new RequestInfo(), "FILING-1", NEW_HEARING_DATE);

        ArgumentCaptor<TaskRequest> captor = ArgumentCaptor.forClass(TaskRequest.class);
        verify(taskService, times(1)).updateTask(captor.capture());
        assertEquals("WARRANT_REISSUE_ICOPS", captor.getValue().getTask().getWorkflow().getAction());
    }

    @Test
    void handleHearingRescheduled_leavesRpadWarrantUntouched() {
        when(userService.createInternalMicroserviceRequestInfo()).thenReturn(new RequestInfo());
        when(taskService.searchTask(any()))
                .thenReturn(List.of(warrantOnChannel("W-RPAD", "RPAD", "ISSUE_WARRANT")));

        service.handleHearingRescheduled(new RequestInfo(), "FILING-1", NEW_HEARING_DATE);

        // RPAD warrants are not auto-reissued, so the task is never updated.
        verify(taskService, never()).updateTask(any());
    }

    @Test
    void handleHearingCompletedAndNewHearingScheduled_reissuesIcopsWarrant() {
        when(userService.createInternalMicroserviceRequestInfo()).thenReturn(new RequestInfo());
        when(taskService.searchTask(any()))
                .thenReturn(List.of(warrantOnChannel("W-ICOPS", "POLICE", "ISSUE_WARRANT")));
        when(taskService.createTask(any())).thenReturn(new Task());

        service.handleHearingCompletedAndNewHearingScheduled(new RequestInfo(), "FILING-1", NEW_HEARING_DATE, null);

        // The old iCoPS warrant is terminated (update) and a replacement is created.
        verify(taskService, times(1)).updateTask(any());
        verify(taskService, times(1)).createTask(any());
    }

    @Test
    void handleHearingCompletedAndNewHearingScheduled_leavesRpadWarrantUntouched() {
        when(userService.createInternalMicroserviceRequestInfo()).thenReturn(new RequestInfo());
        when(taskService.searchTask(any()))
                .thenReturn(List.of(warrantOnChannel("W-RPAD", "RPAD", "ISSUE_WARRANT")));

        service.handleHearingCompletedAndNewHearingScheduled(new RequestInfo(), "FILING-1", NEW_HEARING_DATE, null);

        // RPAD warrants are not auto-reissued: neither terminated nor replaced.
        verify(taskService, never()).updateTask(any());
        verify(taskService, never()).createTask(any());
    }
}
