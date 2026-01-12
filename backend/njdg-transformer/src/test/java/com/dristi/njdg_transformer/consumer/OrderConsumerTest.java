package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.service.OrderNotificationService;
import com.dristi.njdg_transformer.service.OrderService;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import net.minidev.json.JSONArray;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderConsumerTest {

    @Mock
    private OrderService orderService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private OrderNotificationService orderNotificationService;

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private JsonUtil jsonUtil;

    @InjectMocks
    private OrderConsumer orderConsumer;

    private ConsumerRecord<String, Object> consumerRecord;
    private OrderRequest orderRequest;
    private Order order;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setOrderNumber("ORD-001");
        order.setStatus("PUBLISHED");
        order.setOrderCategory("INTERMEDIATE");
        order.setOrderType("JUDGEMENT");
        order.setTenantId("kl");
        order.setCnrNumber("CNR-001");

        orderRequest = new OrderRequest();
        orderRequest.setOrder(order);
        orderRequest.setRequestInfo(RequestInfo.builder().build());

        consumerRecord = new ConsumerRecord<>("order-topic", 0, 0L, "key-1", "{\"order\":{}}");
    }

    @Test
    void testListen_PublishedOrder_IntermediateCategory_Success() throws Exception {
        when(objectMapper.readValue(anyString(), eq(OrderRequest.class))).thenReturn(orderRequest);
        
        Map<String, Map<String, JSONArray>> mdmsResponse = new HashMap<>();
        Map<String, JSONArray> caseMap = new HashMap<>();
        JSONArray outcomeArray = new JSONArray();
        Map<String, String> outcomeItem = new HashMap<>();
        outcomeItem.put("orderType", "JUDGEMENT");
        outcomeItem.put("outcome", "CONVICTED");
        outcomeArray.add(outcomeItem);
        caseMap.put("OutcomeType", outcomeArray);
        mdmsResponse.put("case", caseMap);
        
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), anyList())).thenReturn(mdmsResponse);
        when(jsonUtil.getNestedValue(any(), eq(List.of("orderType")), eq(String.class))).thenReturn("JUDGEMENT");
        when(jsonUtil.getNestedValue(any(), eq(List.of("outcome")), eq(String.class))).thenReturn("CONVICTED");
        when(orderService.processAndUpdateOrder(any(Order.class), any(RequestInfo.class)))
                .thenReturn(new InterimOrder());

        orderConsumer.listen(consumerRecord, "order-topic");

        verify(orderService).processAndUpdateOrder(any(Order.class), any(RequestInfo.class));
    }

    @Test
    void testListen_NonPublishedOrder_Skipped() throws Exception {
        order.setStatus("DRAFT");
        when(objectMapper.readValue(anyString(), eq(OrderRequest.class))).thenReturn(orderRequest);

        orderConsumer.listen(consumerRecord, "order-topic");

        verify(orderService, never()).processAndUpdateOrder(any(), any());
    }

    @Test
    void testListen_NoOutcomeFound_Skipped() throws Exception {
        when(objectMapper.readValue(anyString(), eq(OrderRequest.class))).thenReturn(orderRequest);
        
        Map<String, Map<String, JSONArray>> mdmsResponse = new HashMap<>();
        Map<String, JSONArray> caseMap = new HashMap<>();
        JSONArray outcomeArray = new JSONArray();
        caseMap.put("OutcomeType", outcomeArray);
        mdmsResponse.put("case", caseMap);
        
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), anyList())).thenReturn(mdmsResponse);

        orderConsumer.listen(consumerRecord, "order-topic");

        verify(orderService, never()).processAndUpdateOrder(any(), any());
    }

    @Test
    void testListen_CompositeCategory_Success() throws Exception {
        order.setOrderCategory("COMPOSITE");
        ObjectMapper realMapper = new ObjectMapper();
        ArrayNode compositeItems = realMapper.createArrayNode();
        ObjectNode item = realMapper.createObjectNode();
        item.put("orderType", "JUDGEMENT");
        compositeItems.add(item);
        order.setCompositeItems(compositeItems);

        when(objectMapper.readValue(anyString(), eq(OrderRequest.class))).thenReturn(orderRequest);
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(compositeItems);
        
        Map<String, Map<String, JSONArray>> mdmsResponse = new HashMap<>();
        Map<String, JSONArray> caseMap = new HashMap<>();
        JSONArray outcomeArray = new JSONArray();
        Map<String, String> outcomeItem = new HashMap<>();
        outcomeItem.put("orderType", "JUDGEMENT");
        outcomeItem.put("outcome", "CONVICTED");
        outcomeArray.add(outcomeItem);
        caseMap.put("OutcomeType", outcomeArray);
        mdmsResponse.put("case", caseMap);
        
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), anyList())).thenReturn(mdmsResponse);
        when(jsonUtil.getNestedValue(any(), eq(List.of("orderType")), eq(String.class))).thenReturn("JUDGEMENT");
        when(jsonUtil.getNestedValue(any(), eq(List.of("outcome")), eq(String.class))).thenReturn("CONVICTED");
        when(orderService.processAndUpdateOrder(any(Order.class), any(RequestInfo.class)))
                .thenReturn(new InterimOrder());

        orderConsumer.listen(consumerRecord, "order-topic");

        verify(orderService).processAndUpdateOrder(any(Order.class), any(RequestInfo.class));
    }

    @Test
    void testListen_WithHearingNumber_ProcessesHearing() throws Exception {
        order.setHearingNumber("H-001");
        order.setItemText("<p>Test order text</p>");
        
        when(objectMapper.readValue(anyString(), eq(OrderRequest.class))).thenReturn(orderRequest);
        
        Map<String, Map<String, JSONArray>> mdmsResponse = new HashMap<>();
        Map<String, JSONArray> caseMap = new HashMap<>();
        JSONArray outcomeArray = new JSONArray();
        Map<String, String> outcomeItem = new HashMap<>();
        outcomeItem.put("orderType", "JUDGEMENT");
        outcomeItem.put("outcome", "CONVICTED");
        outcomeArray.add(outcomeItem);
        caseMap.put("OutcomeType", outcomeArray);
        mdmsResponse.put("case", caseMap);
        
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), anyList())).thenReturn(mdmsResponse);
        when(jsonUtil.getNestedValue(any(), eq(List.of("orderType")), eq(String.class))).thenReturn("JUDGEMENT");
        when(jsonUtil.getNestedValue(any(), eq(List.of("outcome")), eq(String.class))).thenReturn("CONVICTED");
        when(orderService.processAndUpdateOrder(any(Order.class), any(RequestInfo.class)))
                .thenReturn(new InterimOrder());

        orderConsumer.listen(consumerRecord, "order-topic");

        // OrderConsumer calls orderNotificationService.processOrdersWithHearings() for hearing processing
        verify(orderNotificationService).processOrdersWithHearings(any(Order.class), any(RequestInfo.class));
    }

    @Test
    void testListen_ExceptionHandling() throws Exception {
        when(objectMapper.readValue(anyString(), eq(OrderRequest.class)))
                .thenThrow(new RuntimeException("Parse error"));

        assertDoesNotThrow(() -> orderConsumer.listen(consumerRecord, "order-topic"));
        verify(orderService, never()).processAndUpdateOrder(any(), any());
    }

    @Test
    void testGetMessageId_WithKey() {
        ConsumerRecord<String, Object> recordWithKey = new ConsumerRecord<>("topic", 0, 100L, "my-key", "{}");
        
        assertDoesNotThrow(() -> orderConsumer.listen(recordWithKey, "topic"));
    }

    @Test
    void testGetMessageId_WithoutKey() {
        ConsumerRecord<String, Object> recordWithoutKey = new ConsumerRecord<>("topic", 1, 200L, null, "{}");
        
        assertDoesNotThrow(() -> orderConsumer.listen(recordWithoutKey, "topic"));
    }
}
