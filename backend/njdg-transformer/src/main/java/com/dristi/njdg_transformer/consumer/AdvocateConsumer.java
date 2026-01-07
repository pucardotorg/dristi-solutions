package com.dristi.njdg_transformer.consumer;


import com.dristi.njdg_transformer.model.advocate.AdvocateRequest;
import com.dristi.njdg_transformer.service.AdvocateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import static com.dristi.njdg_transformer.config.ServiceConstants.ACTIVE;

@Component
@Slf4j
public class AdvocateConsumer {

    private final ObjectMapper objectMapper;
    private final AdvocateService advocateService;

    public AdvocateConsumer(ObjectMapper objectMapper, AdvocateService advocateService) {
        this.objectMapper = objectMapper;
        this.advocateService = advocateService;
    }

    @KafkaListener(topics = "#{'${kafka.topic.update.advocate}'}", groupId = "transformer-advocate")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        log.info("Received advocate message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            processAndUpdateAdvocates(payload);
            log.info("Successfully processed advocate message on topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e){
            log.error("Failed to process advocate message on topic: {} | messageId: {} | error: {}", 
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

    private void processAndUpdateAdvocates(ConsumerRecord<String, Object> payload) {
        String advocateId = null;
        String status = null;
        
        try {
            AdvocateRequest advocateRequest = objectMapper.readValue(payload.value().toString(), AdvocateRequest.class);
            advocateId = advocateRequest.getAdvocate().getId().toString();
            status = advocateRequest.getAdvocate().getStatus();
            
            log.info("Processing advocate registration | advocateId: {} | status: {}", advocateId, status);
            
            if(ACTIVE.equalsIgnoreCase(status)){
                advocateService.processAndUpdateAdvocates(advocateRequest);
                log.info("Successfully processed advocate registration | advocateId: {} | status: {}", advocateId, status);
            } else {
                log.info("Skipping advocate processing due to status | advocateId: {} | status: {} | expectedStatus: {}", 
                         advocateId, status, ACTIVE);
            }
        } catch (Exception e) {
            log.error("Failed to process advocate registration | advocateId: {} | status: {} | error: {}", 
                     advocateId, status, e.getMessage(), e);
            throw new RuntimeException("Advocate processing failed", e);
        }
    }
}
