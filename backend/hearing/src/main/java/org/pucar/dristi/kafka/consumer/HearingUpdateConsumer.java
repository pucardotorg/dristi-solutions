package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.service.HearingService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class HearingUpdateConsumer {

    private final HearingService hearingService;
    private final ObjectMapper objectMapper;
    public HearingUpdateConsumer(HearingService hearingService, ObjectMapper objectMapper) {
        this.hearingService = hearingService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"${hearing.case.reference.number.update}"})
    public void updateCaseReferenceConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received case reference number details on topic: {}", topic);
            hearingService.updateCaseReferenceHearing(objectMapper.convertValue(payload.value(), Map.class));
            log.info("Updated case reference number for hearings");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to case reference number details topic: {}: {}", topic, e.getMessage());
        }

    }
}
