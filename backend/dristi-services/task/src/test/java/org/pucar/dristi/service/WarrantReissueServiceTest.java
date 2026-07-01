package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import org.pucar.dristi.web.models.order.Order;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @BeforeEach
    void setUp() {
        service = new WarrantReissueService(taskService, config, producer, objectMapper, userService,
                orderUtil, pendingTaskUtil, caseUtil, advocateUtil, jsonUtil, demandUtil, mdmsUtil);
    }

    @Test
    void collectCompositeWarrantCoverageKeys_extractsPartyAddressChannelKeysFromWarrantItem() throws Exception {
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(compositeOrderWithWarrant());

        Set<String> keys = service.collectCompositeWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

        assertEquals(2, keys.size(), "expected one key per delivery channel");
        assertTrue(keys.contains(POLICE_KEY), "should cover the POLICE warrant");
        assertTrue(keys.contains(RPAD_KEY), "should cover the RPAD warrant");
    }

    @Test
    void buildWarrantCoverageKey_matchesCompositeCoverageForSamePartyAddressChannel() throws Exception {
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(compositeOrderWithWarrant());
        Set<String> coverage = service.collectCompositeWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

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
        Set<String> coverage = service.collectCompositeWarrantCoverageKeys(new RequestInfo(), ORDER_ID);

        // Same party/address but a channel the composite warrant does not cover -> not skipped.
        Task emailWarrant = new Task();
        emailWarrant.setTaskNumber("W-2");
        emailWarrant.setTaskDetails(objectMapper.readValue(warrantTaskDetail("EMAIL", "Email"), Object.class));

        String key = service.buildWarrantCoverageKey(emailWarrant);
        assertEquals(UNIQUE_ID + "|" + ADDRESS_ID + "|email", key);
        assertTrue(!coverage.contains(key), "non-matching channel must not be covered");
    }

    @Test
    void collectCompositeWarrantCoverageKeys_returnsEmptyForNonCompositeOrder() {
        Order intermediate = new Order();
        intermediate.setOrderCategory("INTERMEDIATE");
        when(orderUtil.getOrderByOrderId(any(RequestInfo.class), eq(ORDER_ID))).thenReturn(intermediate);

        Set<String> keys = service.collectCompositeWarrantCoverageKeys(new RequestInfo(), ORDER_ID);
        assertTrue(keys.isEmpty());
    }

    @Test
    void collectCompositeWarrantCoverageKeys_returnsEmptyForNullOrderId() {
        Set<String> keys = service.collectCompositeWarrantCoverageKeys(new RequestInfo(), null);
        assertTrue(keys.isEmpty());
    }

    @Test
    void buildWarrantCoverageKey_returnsNullWhenNoTaskDetails() {
        Task warrant = new Task();
        warrant.setTaskNumber("W-3");
        assertNull(service.buildWarrantCoverageKey(warrant));
    }
}
