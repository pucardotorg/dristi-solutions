package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NjdgConsumer {

    private final CaseRepository caseRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;
    private final HearingRepository hearingRepository;

    @KafkaListener(topics = "save-case-details")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received message: {}", payload);
            NJDGTransformRecord record = objectMapper.convertValue(payload, NJDGTransformRecord.class);
            boolean recordExists = checkIfRecordExists(record.getCino());
            if (recordExists) {
                log.debug("Updating existing record with CINO: {}", record.getCino());
                caseRepository.updateRecord(record);
            } else {
                log.debug("Inserting new record with CINO: {}", record.getCino());
                caseRepository.insertRecord(record);
            }
            log.info("Message processed successfully. {}", payload);
        } catch (Exception e) {
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }

    /**
     * Checks if a record with the given CINO exists in the database
     *
     * @param cino The Case Identification Number to check
     * @return true if record exists, false otherwise
     */
    private boolean checkIfRecordExists(String cino) {
        try {
            // Try to find the record by CINO
            NJDGTransformRecord existingRecord = caseRepository.findByCino(cino);
            return existingRecord != null;
        } catch (Exception e) {
            log.warn("Error checking if record exists with CINO: {}. Error: {}", cino, e.getMessage());
            return false; // Assume record doesn't exist if there's an error checking
        }
    }

    @KafkaListener(topics = "save-order-details")
    public void listenOrder(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received message: {}, on topic: {}", payload, topic);
            InterimOrder interimOrder = objectMapper.convertValue(payload, InterimOrder.class);
            orderRepository.insertInterimOrder(interimOrder);
            log.info("Message processed successfully. {}", payload);
        } catch (Exception e) {
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "save-hearing-details")
    public void listenHearing(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received message: {}, on topic: {}", payload, topic);
            HearingDetails hearingDetails = objectMapper.convertValue(payload, HearingDetails.class);
            hearingRepository.insertHearingDetails(hearingDetails);
            log.info("Message processed successfully. {}", payload);
        } catch (Exception e) {
            log.error("Error in processing message:: {}", e.getMessage());
        }
    }
    
    @KafkaListener(topics = "save-extra-parties") 
    public void listenExtraParties(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received message on topic: {}", topic);
            // Convert payload to List of PartyDetails
            List<PartyDetails> partyDetailsList = objectMapper.convertValue(payload.value(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, PartyDetails.class));
            for (PartyDetails party : partyDetailsList) {
                try {
                    // Update each party in the database
                    caseRepository.updateExtraParties(party);
                    log.debug("Successfully processed party: {}", party.getPartyName());
                } catch (Exception e) {
                    log.error("Error processing party {}: {}", party.getPartyName(), e.getMessage());
                }
            }
            log.info("Message processed successfully. Topic: {}, Payload size: {}", 
                    topic, partyDetailsList.size());
        } catch (Exception e) {
            log.error("Error in processing message:: {}", e.getMessage(), e);
        }
    }
}
