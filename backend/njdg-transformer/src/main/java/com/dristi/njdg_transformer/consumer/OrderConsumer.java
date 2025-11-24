package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.service.HearingService;
import com.dristi.njdg_transformer.service.OrderService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.tracer.model.CustomException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Component
@Slf4j
public class OrderConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final HearingService hearingService;

    public OrderConsumer(OrderService orderService, ObjectMapper objectMapper, HearingService hearingService) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
        this.hearingService = hearingService;
    }

    @KafkaListener(topics = "#{'${kafka.topics.order}'.split(',')}", groupId = "transformer-order")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = getMessageId(payload);
        log.info("Received order message | topic: {} | messageId: {} | partition: {} | offset: {}",
                topic, messageId, payload.partition(), payload.offset());

        try {
            processOrder(payload);
            log.info("Successfully processed order message | topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e) {
            log.error("Failed to process order message | topic: {} | messageId: {} | error: {}",
                    topic, messageId, e.getMessage(), e);
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

            if (!PUBLISHED_ORDER.equals(status)) {
                log.info("Skipping order processing | orderId: {} | status: {} | expectedStatus: {}",
                        orderId, status, PUBLISHED_ORDER);
                return;
            }

            if (shouldProcessOrder(order)) {
                orderService.processAndUpdateOrder(order, orderRequest.getRequestInfo());
                log.info("Order processed successfully | orderId: {} | status: {}", orderId, status);
            } else {
                log.info("Order does not meet processing criteria | orderId: {} | orderType: {}",
                        orderId, order.getOrderType());
            }
            if(order.getHearingNumber() != null && order.getItemText() != null) {
                hearingService.processBusinessOrder(order, orderRequest.getRequestInfo());
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

    private boolean shouldProcessOrder(Order order) {
        if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
            return getCompositeItems(order).stream()
                    .anyMatch(item -> orderTypes.contains(item.getOrderType()));
        }

        return INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory()) &&
                orderTypes.contains(order.getOrderType());
    }

    private List<Order> getCompositeItems(Order order) {
        log.info("Enriching composite items for order | orderNumber: {} | orderType: {}", order.getOrderNumber(), order.getOrderType());

        Object compositeItemsObj = order.getCompositeItems();
        ObjectNode orderNode = convertOrderToNode(order);

        List<Order> compositeItemsList = new ArrayList<>();
        try {
            JsonNode compositeArray = objectMapper.readTree(objectMapper.writeValueAsString(compositeItemsObj));

            for (JsonNode item : compositeArray) {
                String orderType = item.get("orderType").asText();
                JsonNode orderDetails = item.get("orderSchema").get("orderDetails");

                orderNode.put("orderType", orderType);
                orderNode.set("orderDetails", orderDetails);

                compositeItemsList.add(objectMapper.convertValue(orderNode, Order.class));
            }

            log.info("Successfully enriched composite items | orderNumber: {}", order.getOrderNumber());
        } catch (Exception e) {
            log.error("Error enriching composite items | orderNumber: {}", order.getOrderNumber(), e);
            throw new CustomException("COMPOSITE_ORDER_ENRICHMENT_ERROR", "Error enriching composite items");
        }

        return compositeItemsList;
    }

    private ObjectNode convertOrderToNode(Order order) {
        try {
            String jsonString = objectMapper.writeValueAsString(order);
            JsonNode node = objectMapper.readTree(jsonString);
            if (node.isObject()) {
                return (ObjectNode) node;
            } else {
                throw new CustomException("ORDER_CONVERSION_ERROR", "Order is not a JSON object");
            }
        } catch (JsonProcessingException e) {
            log.error("Error converting order to JSON", e);
            throw new CustomException("ORDER_CONVERSION_ERROR", "Error converting order to JSON");
        }
    }
}
