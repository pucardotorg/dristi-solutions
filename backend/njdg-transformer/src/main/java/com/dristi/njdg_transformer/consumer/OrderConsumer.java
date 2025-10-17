package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.service.OrderService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OrderConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public OrderConsumer(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "#{'${kafka.topics.order}'.split(',')}")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message: {}", payload);
            processAndUpdateCase(payload);
            log.info("Message processed successfully.");
        } catch (Exception e){
            log.error("Error in processing message:: {}", e.getMessage());
        }

    }

    private void processAndUpdateCase(ConsumerRecord<String, Object> payload) {
        try {
            JsonNode orderRequest = objectMapper.convertValue(payload.value(), JsonNode.class);
            Order order = objectMapper.convertValue(orderRequest.get("order"), Order.class);
            RequestInfo requestInfo = objectMapper.convertValue(orderRequest.get("RequestInfo"), RequestInfo.class);
            orderService.updateDataForOrder(order, requestInfo);
        } catch (Exception e) {
            log.info("Error in enriching order:: {}", e.getMessage());
        }
    }
}
