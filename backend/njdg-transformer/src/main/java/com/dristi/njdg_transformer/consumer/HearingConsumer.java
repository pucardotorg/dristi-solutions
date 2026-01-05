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

import static com.dristi.njdg_transformer.config.ServiceConstants.COMPLETED;

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
        String messageId = extractMessageId(payload);
        log.info("Received hearing message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            //Not needed now as all hearings are processed via orders
//            processAndUpdateHearing(payload);
            log.info("Successfully processed hearing message on topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e){
            log.error("Failed to process hearing message on topic: {} | messageId: {} | error: {}", 
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

    private void processAndUpdateHearing(ConsumerRecord<String, Object> payload) {
        String hearingId = null;
        
        try {
            HearingRequest hearingRequest = objectMapper.readValue(payload.value().toString(), HearingRequest.class);
            hearingId = hearingRequest.getHearing().getHearingId();
            
            log.info("Processing hearing update | hearingId: {}", hearingId);

            if(COMPLETED.equalsIgnoreCase(hearingRequest.getHearing().getStatus())){
                hearingService.processAndUpdateHearings(hearingRequest.getHearing(), hearingRequest.getRequestInfo());
            }
            log.info("Successfully processed hearing | hearingId: {}", hearingId);
        } catch (Exception e) {
            log.error("Failed to process hearing | hearingId: {} | error: {}", hearingId, e.getMessage(), e);
            throw new RuntimeException("Hearing processing failed", e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topics.bulk.reschedule}'.split(',')}", groupId = "transformer-bulk-reschedule")
    public void listenBulkReschedule(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        String messageId = extractMessageId(payload);
        log.info("Received bulk reschedule message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            processAndUpdateBulkReschedule(payload);
            log.info("Successfully processed bulk reschedule message on topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e){
            log.error("Failed to process bulk reschedule message on topic: {} | messageId: {} | error: {}", 
                     topic, messageId, e.getMessage(), e);
        }
    }

    private void processAndUpdateBulkReschedule(ConsumerRecord<String, Object> payload) {
        int totalHearings = 0;
        int processedCount = 0;
        int failedCount = 0;
        
        try {
            // Deserialize the payload into HearingUpdateBulkRequest
            HearingUpdateBulkRequest request = objectMapper.convertValue(payload.value(), HearingUpdateBulkRequest.class);
            
            if (request == null || request.getHearings() == null || request.getHearings().isEmpty()) {
                log.warn("No hearings found in bulk reschedule request");
                return;
            }
            
            totalHearings = request.getHearings().size();
            log.info("Processing bulk reschedule | totalHearings: {}", totalHearings);
            
            // Process each hearing
            for (Hearing hearing : request.getHearings()) {
                try {
                    if(COMPLETED.equalsIgnoreCase(hearing.getStatus())){
                        log.info("Processing hearing in bulk | hearingId: {}", hearing.getHearingId());
                        hearingService.processAndUpdateHearings(hearing, request.getRequestInfo());
                        processedCount++;
                    }
                } catch (Exception e) {
                    failedCount++;
                    log.error("Failed to process hearing in bulk | hearingId: {} | error: {}", 
                             hearing.getHearingId(), e.getMessage(), e);
                }
            }
            
            log.info("Completed bulk reschedule processing | totalHearings: {} | processed: {} | failed: {}", 
                    totalHearings, processedCount, failedCount);
                    
        } catch (Exception e) {
            log.error("Failed to process bulk reschedule | totalHearings: {} | processed: {} | error: {}", 
                     totalHearings, processedCount, e.getMessage(), e);
            throw new RuntimeException("Bulk reschedule processing failed", e);
        }
    }
}
