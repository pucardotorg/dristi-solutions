package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.order.Notification;
import com.dristi.njdg_transformer.model.order.NotificationRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.service.OrderNotificationService;
import com.dristi.njdg_transformer.service.OrderService;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final MdmsUtil mdmsUtil;
    private final JsonUtil jsonUtil;
    private final OrderNotificationService orderNotificationService;

    @KafkaListener(topics = "#{'${kafka.topics.order}'.split(',')}", groupId = "transformer-order")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = getMessageId(payload);
        log.info("Received order message | topic: {} | messageId: {} | partition: {} | offset: {}",
                topic, messageId, payload.partition(), payload.offset());

        try {
            processOrder(payload);
            processOrderForHearing(payload);
            log.info("Successfully processed order message | topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e) {
            log.error("Failed to process order message | topic: {} | messageId: {} | error: {}",
                    topic, messageId, e.getMessage(), e);
        }
    }

    private void processOrderForHearing(ConsumerRecord<String, Object> payload) {
        log.info("Starting order processing for hearing...");
        String orderId = null;
        String status = null;

        try {
            OrderRequest orderRequest = parsePayload(payload);
            Order order = orderRequest.getOrder();
            orderId = order.getOrderNumber();
            status = order.getStatus();

            log.info("Processing order for hearing | orderId: {} | status: {}", orderId, status);

            if(PUBLISHED_ORDER.equalsIgnoreCase(order.getStatus())) {
                orderNotificationService.processOrdersWithHearings(order, orderRequest.getRequestInfo());
            }
        } catch (Exception e) {
            log.error("Error processing order for hearing | orderId: {} | status: {} | error: {}",
                    orderId, status, e.getMessage(), e);
            throw new RuntimeException("Order processing failed", e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.notification.order.topic}'.split(',')}", groupId = "transformer-notification-order")
    public void listenNotificationOrder(ConsumerRecord<String, Object> payload) {
        log.info("Received notification order message | topic: {} | messageId: {} | partition: {} | offset: {}",
                payload.topic(), getMessageId(payload), payload.partition(), payload.offset());
        try {
            processNotificationOrder(payload);
        } catch (Exception e) {
            log.error("Error processing notification order | topic: {} | messageId: {} | error: {}",
                    payload.topic(), getMessageId(payload), e.getMessage(), e);
        }
    }

    private void processNotificationOrder(ConsumerRecord<String, Object> payload) {
        log.info("Starting notification order processing...");

        try {
            NotificationRequest notificationRequest = objectMapper.readValue(payload.value().toString(), NotificationRequest.class);
            Notification notification = notificationRequest.getNotification();
            String status = notification.getStatus();

            if(PUBLISHED_ORDER.equalsIgnoreCase(status)) {
                orderNotificationService.processNotificationOrders(notification, notificationRequest.getRequestInfo());
            }
        } catch (Exception e) {
            log.error("Error processing notification order | error: {}", e.getMessage(), e);
            throw new RuntimeException("Notification order processing failed", e);
        }
    }

    private String getMessageId(ConsumerRecord<String, Object> payload) {
        return payload.key() != null ? payload.key() : String.format("p%d-o%d", payload.partition(), payload.offset());
    }

    private void processOrder(ConsumerRecord<String, Object> payload) {
        log.info("Starting order processing...");

        String orderId = null;
        String status = null;

        try {
            OrderRequest orderRequest = parsePayload(payload);
            Order order = orderRequest.getOrder();

            orderId = order.getOrderNumber();
            status = order.getStatus();

            log.info("Processing order | orderId: {} | status: {}", orderId, status);

            if (!PUBLISHED_ORDER.equalsIgnoreCase(status)) {
                log.info("Skipping order processing | orderId: {} | status: {} | expectedStatus: {}",
                        orderId, status, PUBLISHED_ORDER);
                return;
            }

            if (shouldProcessOrder(order, orderRequest.getRequestInfo())) {
                orderService.processAndUpdateOrder(order, orderRequest.getRequestInfo());
                log.info("Order processed successfully | orderId: {} | status: {}", orderId, status);
            } else {
                log.info("Order does not meet processing criteria | orderId: {} | orderType: {}",
                        orderId, order.getOrderType());
            }
        } catch (Exception e) {
            log.error("Error processing order | orderId: {} | status: {} | error: {}", orderId, status, e.getMessage(), e);
            throw new RuntimeException("Order processing failed", e);
        }
    }

    private OrderRequest parsePayload(ConsumerRecord<String, Object> payload) {
        try {
            return objectMapper.readValue(payload.value().toString(), OrderRequest.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse order payload", e);
            throw new CustomException("ORDER_PAYLOAD_PARSE_ERROR", "Unable to parse order payload");
        }
    }

    private boolean shouldProcessOrder(Order order, RequestInfo requestInfo) {
        if(INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
            String outcome = getOutcomeValue(order.getOrderType(), order.getTenantId(), requestInfo);
            if(outcome != null) {
                order.setOutcome(outcome);
                log.info("Set outcome for intermediate order | orderNumber: {} | orderType: {} | outcome: {}",
                         order.getOrderNumber(), order.getOrderType(), outcome);
                return true;
            }
        } else if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
            JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
            for(JsonNode compositeItem : compositeItems){
                String outcome = getOutcomeValue(compositeItem.get("orderType").asText(), order.getTenantId(), requestInfo);
                if(outcome != null) {
                    order.setOutcome(outcome);
                    log.info("Set outcome for composite order | orderNumber: {} | orderType: {} | outcome: {}",
                             order.getOrderNumber(), compositeItem.get("orderType").asText(), outcome);
                    return true;
                }
            }
        }
        return false;
    }

    private String getOutcomeValue(String orderType, String tenantId, RequestInfo requestInfo) {
        try {
            Map<String, Map<String, JSONArray>> caseOutcomes = mdmsUtil.fetchMdmsData(requestInfo, tenantId, "case", List.of("OutcomeType"));
            JSONArray outcomeData = caseOutcomes.get("case").get("OutcomeType");
            
            for (Object outcomeObject : outcomeData) {
                String outcomeOrderType = jsonUtil.getNestedValue(outcomeObject, List.of("orderType"), String.class);
                if(orderType.equalsIgnoreCase(outcomeOrderType)){
                    String outcomeValue = jsonUtil.getNestedValue(outcomeObject, List.of("outcome"), String.class);
                    log.info("Found outcome for orderType | orderType: {} | outcome: {}", orderType, outcomeValue);
                    return outcomeValue;
                }
            }
            
            log.info("No outcome found for orderType | orderType: {}", orderType);
            return null;
        } catch (Exception e) {
            log.error("Error fetching outcome value for orderType | orderType: {} | error: {}", orderType, e.getMessage(), e);
            return null;
        }
    }
}
