package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.cases.CaseRequest;
import com.dristi.njdg_transformer.service.CaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import static com.dristi.njdg_transformer.config.ServiceConstants.caseStatus;

@Component
@Slf4j
public class CaseConsumer {

    private final CaseService caseService;
    private final ObjectMapper objectMapper;

    public CaseConsumer(CaseService caseService, ObjectMapper objectMapper) {
        this.caseService = caseService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "#{'${kafka.topics.case}'.split(',')}")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message:: {} on topic:: {} ", payload.value(), topic);
            processAndUpdateCase(payload);
            log.info("Message processed successfully on topic:: {}", topic);
        } catch (Exception e){
            log.error("Error in processing message:: {}", e.getMessage());
        }

    }

    private void processAndUpdateCase(ConsumerRecord<String, Object> payload) {
        try {
            CaseRequest caseRequest = objectMapper.readValue(payload.value().toString(), CaseRequest.class);
            String status = caseRequest.getCourtCase().getStatus();
            if(caseStatus.contains(status)){
                caseService.processAndUpdateCase(caseRequest.getCourtCase(), caseRequest.getRequestInfo());
            }
        } catch (Exception e) {
            log.error("Error in updating case: ", e);
        }
    }
}
