package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
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

import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NjdgConsumer {

    private final CaseRepository caseRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;
    private final HearingRepository hearingRepository;
    private final AdvocateRepository advocateRepository;

    @KafkaListener(topics = "#{'${kafka.topic.save.case.details}'}")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        String cino = null;
        
        log.info("Received case details message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            NJDGTransformRecord record = objectMapper.readValue(payload.value().toString(), NJDGTransformRecord.class);
            cino = record.getCino();
            
            log.info("Processing case details | CINO: {}", cino);
            
            NJDGTransformRecord existingRecord = checkIfRecordExists(cino);
            if (existingRecord != null) {
                log.info("Updating existing case record | CINO: {}", cino);
                if(existingRecord.getPurposeNext() != null && record.getPurposeNext() == null) {
                    record.setPurposeNext(existingRecord.getPurposeNext());
                }
                caseRepository.updateRecord(record);
                log.info("Successfully updated case record | CINO: {}", cino);
            } else {
                log.info("Inserting new case record | CINO: {}", cino);
                caseRepository.insertRecord(record);
                log.info("Successfully inserted case record | CINO: {}", cino);
            }
        } catch (Exception e) {
            log.error("Failed to process case details | CINO: {} | messageId: {} | error: {}", 
                     cino, messageId, e.getMessage(), e);
        }
    }

    /**
     * Extract message identifier for logging purposes
     */
    private String extractMessageId(ConsumerRecord<String, Object> payload) {
        return payload.key() != null ? payload.key() : 
               String.format("p%d-o%d", payload.partition(), payload.offset());
    }

    /**
     * Checks if a record with the given CINO exists in the database
     *
     * @param cino The Case Identification Number to check
     * @return true if record exists, false otherwise
     */
    private NJDGTransformRecord checkIfRecordExists(String cino) {
        try {
            // Try to find the record by CINO
            return caseRepository.findByCino(cino);
        } catch (Exception e) {
            log.warn("Error checking if record exists | CINO: {} | error: {}", cino, e.getMessage());
            return null; // Assume record doesn't exist if there's an error checking
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.order.details}'}")
    public void listenOrder(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        String orderNo = null;

        log.info("Received order details message on topic: {} | messageId: {} | partition: {} | offset: {}",
                topic, messageId, payload.partition(), payload.offset());

        try {
            InterimOrder interimOrder = objectMapper.readValue(payload.value().toString(), InterimOrder.class);
            orderNo = interimOrder.getCourtOrderNumber();

            log.info("Processing order details | orderNo: {}", orderNo);

            orderRepository.insertInterimOrder(interimOrder);
            updateCaseDecisionDate(interimOrder);
            log.info("Successfully processed order | orderNo: {}", orderNo);
        } catch (Exception e) {
            log.error("Failed to process order | orderNo: {} | messageId: {} | error: {}",
                     orderNo, messageId, e.getMessage(), e);
        }
    }

    private void updateCaseDecisionDate(InterimOrder interimOrder) {
        String cino = interimOrder.getCino();
        NJDGTransformRecord record = caseRepository.findByCino(cino);
        if(record != null) {
            record.setDateOfDecision(interimOrder.getOrderDate());
            record.setDispReason(interimOrder.getDispReason());
            caseRepository.updateRecord(record);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.hearing.details}'}")
    public void listenHearing(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        String cino = null;
        String hearingId = null;
        
        log.info("Received hearing details message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            // Deserialize payload
            HearingDetails hearingDetails = objectMapper.readValue(payload.value().toString(), HearingDetails.class);
            cino = hearingDetails.getCino();
            hearingId = hearingDetails.getHearingId();

            log.info("Processing hearing details | CINO: {} | hearingId: {}", cino, hearingId);

            // Insert new hearing
            List<HearingDetails> hearingDetailsList = hearingRepository.getHearingDetailsByCino(hearingDetails.getCino());
            int maxSrNo = hearingDetailsList.stream().mapToInt(HearingDetails::getSrNo).max().orElse(0);
            hearingDetails.setSrNo(maxSrNo + 1);
            hearingRepository.insertHearingDetails(hearingDetails);
            updateCasePurpose(cino, hearingDetails);
            log.info("Successfully inserted hearing | CINO: {} | hearingId: {}", cino, hearingId);

        } catch (Exception e) {
            log.error("Failed to process hearing details | CINO: {} | hearingId: {} | messageId: {} | error: {}", 
                     cino, hearingId, messageId, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.update.hearing.details}'}")
    public void updateHearingDetails(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        String cino = null;
        String hearingId = null;

        log.info("Received update hearing details message on topic: {} | messageId: {} | partition: {} | offset: {}",
                topic, messageId, payload.partition(), payload.offset());
        try {
            // Deserialize payload
            HearingDetails hearingDetails = objectMapper.readValue(payload.value().toString(), HearingDetails.class);
            cino = hearingDetails.getCino();
            hearingId = hearingDetails.getHearingId();

            log.info("Processing hearing details | CINO: {} | hearingId: {}", cino, hearingId);

            // Insert new hearing
            hearingRepository.updateHearingDetails(hearingDetails);
            log.info("Successfully inserted hearing | CINO: {} | hearingId: {}", cino, hearingId);

        } catch (Exception e) {
            log.error("Failed to process hearing details | CINO: {} | hearingId: {} | messageId: {} | error: {}",
                    cino, hearingId, messageId, e.getMessage(), e);
        }
    }
    private void updateCasePurpose(String cino, HearingDetails hearingDetails) {
        // Update case record with hearing information
        List<HearingDetails> hearingDetailsList = hearingRepository.getHearingDetailsByCino(cino);
        NJDGTransformRecord existingRecord = caseRepository.findByCino(cino);
        if (existingRecord != null) {
            existingRecord.setDateFirstList(hearingDetails.getSrNo() == 1 ? hearingDetails.getHearingDate() : existingRecord.getDateFirstList());
            existingRecord.setDateNextList(hearingDetails.getNextDate() != null ? hearingDetails.getNextDate() : hearingDetails.getHearingDate());
            existingRecord.setDateLastList(hearingDetails.getHearingDate());
            existingRecord.setPurposeCode(getPurposeValue(hearingDetails.getPurposeOfListing()));

            // Calculate purpose_next and purpose_previous from hearings
            if (hearingDetailsList != null && !hearingDetailsList.isEmpty()) {
                // Sort hearings by srNo to get chronological order
                hearingDetailsList.sort(Comparator.comparingInt(HearingDetails::getSrNo));

                // Find current hearing position
                int currentIndex = -1;
                for (int i = 0; i < hearingDetailsList.size(); i++) {
                    if (hearingDetailsList.get(i).getSrNo().equals(hearingDetails.getSrNo())) {
                        currentIndex = i;
                        break;
                    }
                }

                // Set purpose_previous (previous hearing's purpose)
                if (currentIndex > 0) {
                    HearingDetails previousHearing = hearingDetailsList.get(currentIndex - 1);
                    Integer purposePrevious = getPurposeValue(previousHearing.getPurposeOfListing());
                    existingRecord.setPurposePrevious(purposePrevious);
                    log.info("Set purpose_previous: {} | CINO: {}", purposePrevious, cino);
                } else {
                    existingRecord.setPurposePrevious(0); // Default value when no previous hearing
                    log.info("Set purpose_previous to default 0 (no previous hearing) | CINO: {}", cino);
                }
                existingRecord.setPurposeNext(hearingDetails.getNextPurpose() != null ? getPurposeValue(hearingDetails.getNextPurpose()) : getPurposeValue(hearingDetails.getPurposeOfListing()));
            }
            caseRepository.updateRecord(existingRecord);
            log.info("Updated case record with hearing info | CINO: {}", cino);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.extra.parties}'}")
    public void listenExtraParties(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        int totalParties = 0;
        int processedCount = 0;
        int failedCount = 0;
        
        log.info("Received extra parties message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            // Convert payload to List of PartyDetails
            List<PartyDetails> partyDetailsList = objectMapper.readValue((String) payload.value(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, PartyDetails.class));
            
            totalParties = partyDetailsList.size();
            log.info("Processing extra parties | totalParties: {}", totalParties);
            
            for (PartyDetails party : partyDetailsList) {
                try {
                    log.info("Processing extra party | partyName: {} | CINO: {}", 
                             party.getPartyName(), party.getCino());
                    caseRepository.updateExtraParties(party);
                    processedCount++;
                } catch (Exception e) {
                    failedCount++;
                    log.error("Failed to process extra party | partyName: {} | CINO: {} | error: {}", 
                             party.getPartyName(), party.getCino(), e.getMessage(), e);
                }
            }
            
            log.info("Completed extra parties processing | totalParties: {} | processed: {} | failed: {}", 
                    totalParties, processedCount, failedCount);
        } catch (Exception e) {
            log.error("Failed to process extra parties | messageId: {} | totalParties: {} | error: {}", 
                     messageId, totalParties, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.advocate.details}'}")
    public void listenAdvocates(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        Integer advocateCode = null;
        
        log.info("Received advocate details message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            AdvocateDetails advocateDetails = objectMapper.readValue(payload.value().toString(), AdvocateDetails.class);
            advocateCode = advocateDetails.getAdvocateCode();
            
            log.info("Processing advocate details | advocateCode: {}", advocateCode);
            
            advocateRepository.insertAdvocateDetails(advocateDetails);
            log.info("Successfully processed advocate | advocateCode: {}", advocateCode);
        } catch (Exception e) {
            log.error("Failed to process advocate | advocateCode: {} | messageId: {} | error: {}", 
                     advocateCode, messageId, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.update.advocate.details}'}")
    public void listenAdvocateUpdates(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        Integer advocateCode = null;
        String advocateId = null;
        
        log.info("Received advocate update message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            AdvocateDetails advocateDetails = objectMapper.readValue(payload.value().toString(), AdvocateDetails.class);
            advocateCode = advocateDetails.getAdvocateCode();
            advocateId = advocateDetails.getAdvocateId();
            
            log.info("Processing advocate update | advocateId: {} | advocateCode: {}", advocateId, advocateCode);
            
            advocateRepository.updateAdvocateDetails(advocateDetails);
            log.info("Successfully updated advocate | advocateId: {} | advocateCode: {}", advocateId, advocateCode);
        } catch (Exception e) {
            log.error("Failed to update advocate | advocateId: {} | advocateCode: {} | messageId: {} | error: {}", 
                     advocateId, advocateCode, messageId, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.act.details}'}")
    public void listenActDetails(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        Integer actCode = null;

        log.info("Received act details message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            Act act = objectMapper.readValue(payload.value().toString(), Act.class);
            actCode = act.getActCode();
            
            log.info("Processing act details | actCode: {} | CINO: {}", actCode, act.getCino());
            
            caseRepository.upsertActDetails(act);
            log.info("Successfully processed act | actCode: {} | CINO: {}", actCode, act.getCino());
        } catch (Exception e) {
            log.error("Failed to process act | actCode: {} | messageId: {} | error: {}", 
                     actCode, messageId, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.extra.advocate.details}'}")
    public void listenExtraAdvocateDetails(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        int totalAdvocates = 0;
        int processedCount = 0;
        int failedCount = 0;
        
        log.info("Received extra advocate details message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            List<ExtraAdvocateDetails> extraAdvocateDetails = objectMapper.readValue(payload.value().toString(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ExtraAdvocateDetails.class));
            
            totalAdvocates = extraAdvocateDetails.size();
            log.info("Processing extra advocates | totalAdvocates: {}", totalAdvocates);
            
            for (ExtraAdvocateDetails extraAdvocateDetail : extraAdvocateDetails) {
                try {
                    log.info("Processing extra advocate | advocateName: {} | CINO: {}", 
                             extraAdvocateDetail.getAdvName(), extraAdvocateDetail.getCino());
                    caseRepository.updateExtraAdvocates(extraAdvocateDetail);
                    processedCount++;
                } catch (Exception e) {
                    failedCount++;
                    log.error("Failed to process extra advocate | advocateName: {} | CINO: {} | error: {}", 
                             extraAdvocateDetail.getAdvName(), extraAdvocateDetail.getCino(), e.getMessage(), e);
                }
            }
            
            log.info("Completed extra advocates processing | totalAdvocates: {} | processed: {} | failed: {}", 
                    totalAdvocates, processedCount, failedCount);
        } catch (Exception e) {
            log.error("Failed to process extra advocates | messageId: {} | totalAdvocates: {} | error: {}", 
                     messageId, totalAdvocates, e.getMessage(), e);
        }
    }

    /**
     * Converts purpose of listing string to Integer, handling null/empty/zero values
     * @param purposeOfListing The purpose of listing as string
     * @return Integer value or 0 as default for null/empty/"0" values
     */
    private Integer getPurposeValue(String purposeOfListing) {
        if (purposeOfListing == null || purposeOfListing.trim().isEmpty()) {
            return 0; // Default value for null or empty
        }
        
        try {
            // Return 0 if the parsed value is 0 (default/invalid purpose code)
            return Integer.valueOf(purposeOfListing.trim());
        } catch (NumberFormatException e) {
            log.warn("Invalid purpose of listing value: '{}', using default 0", purposeOfListing);
            return 0; // Default value for invalid format
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.save.case.conversion.details}'}")
    public void listenCaseConversionDetails(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);

        log.info("Received case conversion details message on topic: {} | messageId: {} | partition: {} | offset: {}",
                topic, messageId, payload.partition(), payload.offset());

        try {
            CaseTypeDetails caseTypeDetails = objectMapper.readValue(payload.value().toString(), CaseTypeDetails.class);

            log.info("Processing case conversion details | CINO: {}", caseTypeDetails.getCino());

            Integer srNo = caseRepository.getNextSrNoForCaseConversion(caseTypeDetails.getCino());
            caseTypeDetails.setSrNo(srNo);
            log.info("Assigned sr_no: {} for CINO: {}", srNo, caseTypeDetails.getCino());

            caseRepository.insertCaseConversionDetails(caseTypeDetails);
            log.info("Successfully processed case conversion | CINO: {}", caseTypeDetails.getCino());
        } catch (Exception e) {
            log.error("Failed to process case conversion | messageId: {} | error: {}",
                      messageId, e.getMessage(), e);
        }
    }
}
