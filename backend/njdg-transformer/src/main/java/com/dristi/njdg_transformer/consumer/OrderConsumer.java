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

    @KafkaListener(topics = "#{'${kafka.topics.order}'.split(',')}")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message: {}", payload);
            processAndUpdateOrder(payload);
            log.info("Message processed successfully.");
        } catch (Exception e){
            log.error("Error in processing message:: {}", e.getMessage());
        }

    }

    private void processAndUpdateOrder(ConsumerRecord<String, Object> payload) {
        try {
            OrderRequest orderRequest = objectMapper.convertValue(payload.value(), OrderRequest.class);
            if(PUBLISHED_ORDER.equals(orderRequest.getOrder().getStatus())){
                orderService.processAndUpdateOrder(orderRequest.getOrder(), orderRequest.getRequestInfo());
            }
        } catch (Exception e) {
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }
}
