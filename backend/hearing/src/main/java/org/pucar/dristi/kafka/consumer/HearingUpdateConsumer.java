package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.service.HearingService;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.HearingRequest;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ABANDONED;
import static org.pucar.dristi.config.ServiceConstants.COMPLETED;

@Component
@Slf4j
public class HearingUpdateConsumer {

    private final HearingService hearingService;
    private final ObjectMapper objectMapper;

    private final OrderUtil orderUtil;

    public HearingUpdateConsumer(HearingService hearingService, ObjectMapper objectMapper, OrderUtil orderUtil) {
        this.hearingService = hearingService;
        this.objectMapper = objectMapper;
        this.orderUtil = orderUtil;
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

    @KafkaListener(topics = {"${kafka.topics.hearing.update}"})
    public void updateHearingConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received hearing details on topic: {}", topic);
            HearingRequest hearingRequest = objectMapper.convertValue(payload, HearingRequest.class);
            String hearingStatus = hearingRequest.getHearing().getStatus();
            if (hearingStatus.equalsIgnoreCase(COMPLETED) || hearingStatus.equalsIgnoreCase(ABANDONED)) {
                orderUtil.closeActivePaymentPendingTasks(hearingRequest);
            }
            log.info("Updated hearings");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to hearings topic: {}: {}", topic, e.getMessage());
        }
    }
}
