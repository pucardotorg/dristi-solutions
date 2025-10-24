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

    @KafkaListener(topics = "user-registration-advocate")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received message:: {} on topic:: {} ", payload.value(), topic);
            processAndUpdateAdvocates(payload);
            log.info("Message processed successfully on topic:: {}", topic);
        } catch (Exception e){
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }

    private void processAndUpdateAdvocates(ConsumerRecord<String, Object> payload) {
        try {
            AdvocateRequest advocateRequest = objectMapper.convertValue(payload, AdvocateRequest.class);
            if(ACTIVE.equalsIgnoreCase(advocateRequest.getAdvocate().getStatus())){
                advocateService.processAndUpdateAdvocates(advocateRequest);
            }
        } catch (IllegalArgumentException e) {
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }
}
