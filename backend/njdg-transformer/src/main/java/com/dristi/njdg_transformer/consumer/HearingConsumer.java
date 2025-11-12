package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingRequest;
import com.dristi.njdg_transformer.model.hearing.HearingUpdateBulkRequest;
import com.dristi.njdg_transformer.service.HearingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
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

    @KafkaListener(topics = "#{'${kafka.topics.hearing}'.split(',')}", groupId = "transformer-hearing")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message: {}", payload);
            processAndUpdateHearing(payload);
            log.info("Message processed successfully.");
        } catch (Exception e){
            log.error("Error in processing message:: {}", e.getMessage());
        }

    }

    private void processAndUpdateHearing(ConsumerRecord<String, Object> payload) {
        try {
            HearingRequest hearingRequest = objectMapper.readValue(payload.value().toString(), HearingRequest.class);
            hearingService.processAndUpdateHearings(hearingRequest.getHearing());
        } catch (Exception e) {
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "#{'${kafka.topics.bulk.reschedule}'.split(',')}", groupId = "transformer-bulk-reschedule")
    public void listenBulkReschedule(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message: {}", payload);
            processAndUpdateBulkReschedule(payload);
            log.info("Message processed successfully.");
        } catch (Exception e){
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }

    private void processAndUpdateBulkReschedule(ConsumerRecord<String, Object> payload) {
        try {
            log.info("Received bulk hearing update message: key={}, partition={}, offset={}",
                    payload.key(), payload.partition(), payload.offset());

            // Deserialize the payload into HearingUpdateBulkRequest
            HearingUpdateBulkRequest request = objectMapper.convertValue(payload.value(), HearingUpdateBulkRequest.class);
            if (request == null || request.getHearings() == null || request.getHearings().isEmpty()) {
                log.warn("No hearings found in the bulk update request.");
                return;
            }
            log.info("Processing {} hearings in bulk update", request.getHearings().size());
            // Iterate and process each hearing
            for (Hearing hearing : request.getHearings()) {
                try {
                    hearingService.processAndUpdateHearings(hearing);
                } catch (Exception e) {
                    log.error("Failed to process hearing ID {}: {}", hearing.getHearingId(), e.getMessage(), e);
                }
            }
            log.info("Bulk hearing update processing completed successfully.");
        } catch (Exception e) {
            log.error("Error while processing bulk hearing update payload: {}", e.getMessage(), e);
        }
    }
}
