package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.service.HearingService;
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
public class HearingConsumer {

    private final HearingService hearingService;
    private final ObjectMapper objectMapper;

    public HearingConsumer(HearingService hearingService, ObjectMapper objectMapper) {
        this.hearingService = hearingService;
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

    }
}
