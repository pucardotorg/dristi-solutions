package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import static com.dristi.njdg_transformer.config.ServiceConstants.PUBLISHED_ORDER;

@Component
@Slf4j
public class OrderConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public OrderConsumer(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "#{'${kafka.topics.order}'.split(',')}", groupId = "transformer-order")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        String messageId = extractMessageId(payload);
        log.info("Received order message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            processAndUpdateOrder(payload);
            log.info("Successfully processed order message on topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e){
            log.error("Failed to process order message on topic: {} | messageId: {} | error: {}", 
                     topic, messageId, e.getMessage(), e);
        }
    }

    /**
     * Extract message identifier for logging purposes
     */
    private String extractMessageId(ConsumerRecord<String, Object> payload) {
        return payload.key() != null ? payload.key() : 
               String.format("p%d-o%d", payload.partition(), payload.offset());
    }

    private void processAndUpdateOrder(ConsumerRecord<String, Object> payload) {
        log.info("Order processing is currently disabled - skipping message processing");
        
        // TODO: Uncomment and refactor when order processing is re-enabled
        /*
        String orderId = null;
        String status = null;
        
        try {
            OrderRequest orderRequest = objectMapper.readValue(payload.value().toString(), OrderRequest.class);
            orderId = orderRequest.getOrder().getOrderId();
            status = orderRequest.getOrder().getStatus();
            
            log.debug("Processing order | orderId: {} | status: {}", orderId, status);
            
            if(PUBLISHED_ORDER.equals(status)){
                orderService.processAndUpdateOrder(orderRequest.getOrder(), orderRequest.getRequestInfo());
                log.info("Successfully processed order | orderId: {} | status: {}", orderId, status);
            } else {
                log.debug("Skipping order processing due to status | orderId: {} | status: {} | expectedStatus: {}", 
                         orderId, status, PUBLISHED_ORDER);
            }
        } catch (Exception e) {
            log.error("Failed to process order | orderId: {} | status: {} | error: {}", 
                     orderId, status, e.getMessage(), e);
            throw new RuntimeException("Order processing failed", e);
        }
        */
    }
}
