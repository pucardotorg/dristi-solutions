package com.dristi.njdg_transformer.consumer;

import ch.qos.logback.core.encoder.EchoEncoder;
import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.service.CaseService;
import com.dristi.njdg_transformer.utils.CaseUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.caseStatus;

@Component
@Slf4j
@RequiredArgsConstructor
public class CaseConsumer {

    private final CaseService caseService;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;


    @KafkaListener(topics = "#{'${kafka.topics.case}'.split(',')}", groupId = "transformer-case")
    public void listen(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        String messageId = extractMessageId(payload);
        log.info("Received case message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            processAndUpdateCase(payload);
            log.info("Successfully processed case message on topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e){
            log.error("Failed to process case message on topic: {} | messageId: {} | error: {}", 
                     topic, messageId, e.getMessage(), e);
        }
    }

    private void processAndUpdateCase(ConsumerRecord<String, Object> payload) {
        String filingNumber = null;
        String status = null;
        
        try {
            CaseRequest caseRequest = objectMapper.readValue(payload.value().toString(), CaseRequest.class);
            filingNumber = caseRequest.getCourtCase().getFilingNumber();
            status = caseRequest.getCourtCase().getStatus();
            
            log.info("Processing case update | filingNumber: {} | status: {}", filingNumber, status);
            
            if(caseStatus.contains(status)){
                CaseSearchRequest caseSearchRequest = createCaseSearchRequest(caseRequest.getRequestInfo(), filingNumber);
                JsonNode cases = caseUtil.searchCaseDetails(caseSearchRequest);
                CourtCase courtCase = objectMapper.convertValue(cases, CourtCase.class);
                
                if(courtCase.getCnrNumber() != null){
                    log.info("Found case with CNR: {} for filingNumber: {}", courtCase.getCnrNumber(), filingNumber);
                    caseService.processAndUpdateCase(courtCase, caseRequest.getRequestInfo());
                    log.info("Successfully updated case | filingNumber: {} | CNR: {}", filingNumber, courtCase.getCnrNumber());
                } else {
                    log.warn("No CNR found for case | filingNumber: {}", filingNumber);
                }
            } else {
                log.info("Skipping case processing due to status | filingNumber: {} | status: {} | allowedStatuses: {}", 
                         filingNumber, status, caseStatus);
            }
        } catch (Exception e) {
            log.error("Failed to process case update | filingNumber: {} | status: {} | error: {}", 
                     filingNumber, status, e.getMessage(), e);
            throw new RuntimeException("Case processing failed", e);
        }
    }

    /**
     * Extract message identifier for logging purposes
     */
    private String extractMessageId(ConsumerRecord<String, Object> payload) {
        return payload.key() != null ? payload.key() : 
               String.format("p%d-o%d", payload.partition(), payload.offset());
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    @KafkaListener(topics = "#{'${kafka.topics.join.case}'.split(',')}", groupId = "transformer-case")
    public void listenJoinCase(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        String messageId = extractMessageId(payload);
        log.info("Received join case message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            processAndUpdateJoinCase(payload);
            log.info("Successfully processed join case message on topic: {} | messageId: {}", topic, messageId);
        } catch (Exception e){
            log.error("Failed to process join case message on topic: {} | messageId: {} | error: {}", 
                     topic, messageId, e.getMessage(), e);
        }
    }

    private void processAndUpdateJoinCase(ConsumerRecord<String, Object> payload) {
        String filingNumber = null;
        
        try {
            CourtCase courtCase = objectMapper.readValue(payload.value().toString(), CourtCase.class);
            filingNumber = courtCase.getFilingNumber();
            
            log.info("Processing join case | filingNumber: {}", filingNumber);
            
            RequestInfo requestInfo = RequestInfo.builder()
                    .apiId("Rainmaker")
                    .userInfo(User.builder()
                            .userName("internalUser")
                            .name("internal")
                            .mobileNumber("1002335566")
                            .type("SYSTEM")
                            .tenantId("kl")
                            .roles(List.of(Role.builder()
                                    .tenantId("kl")
                                    .code("CASE_VIEWER")
                                    .name("CASE_VIEWER").build(),
                                    Role.builder()
                                            .tenantId("kl")
                                            .code("ORDER_VIEWER")
                                            .name("ORDER_VIEWER").build()))
                            .build())
                    .build();
                    
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, filingNumber);
            JsonNode courtCaseNode = caseUtil.searchCaseDetails(caseSearchRequest);
            CourtCase courtCases = objectMapper.convertValue(courtCaseNode, CourtCase.class);
            
            if(courtCases.getCnrNumber() != null){
                log.info("Found case with CNR: {} for join case | filingNumber: {}", courtCases.getCnrNumber(), filingNumber);
                caseService.processAndUpdateCase(courtCases, requestInfo);
                log.info("Successfully processed join case | filingNumber: {} | CNR: {}", filingNumber, courtCases.getCnrNumber());
            } else {
                log.warn("No CNR found for join case | filingNumber: {}", filingNumber);
            }
        } catch (Exception e) {
            log.error("Failed to process join case | filingNumber: {} | error: {}", filingNumber, e.getMessage(), e);
            throw new RuntimeException("Join case processing failed", e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.case.outcome}'}", groupId = "transformer-case")
    public void listenCaseOutcome(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        String messageId = extractMessageId(payload);
        String filingNumber = null;
        
        log.info("Received case outcome message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            CaseOutcome outcome = objectMapper.readValue(payload.value().toString(), CaseOutcome.class);
            filingNumber = outcome.getOutcome().getFilingNumber();
            
            log.info("Processing case outcome | filingNumber: {}", filingNumber);
            
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(outcome.getRequestInfo(), filingNumber);
            JsonNode cases = caseUtil.searchCaseDetails(caseSearchRequest);
            CourtCase courtCase = objectMapper.convertValue(cases, CourtCase.class);
            courtCase.setJudgementDate(outcome.getOutcome().getAuditDetails().getLastModifiedTime());
            
            if(courtCase.getCnrNumber() != null) {
                log.info("Found case with CNR: {} for outcome | filingNumber: {}", courtCase.getCnrNumber(), filingNumber);
                caseService.processAndUpdateCase(courtCase, outcome.getRequestInfo());
                log.info("Successfully processed case outcome | filingNumber: {} | CNR: {}", filingNumber, courtCase.getCnrNumber());
            } else {
                log.warn("No CNR found for case outcome | filingNumber: {}", filingNumber);
            }
        } catch (Exception e){
            log.error("Failed to process case outcome | filingNumber: {} | messageId: {} | error: {}", 
                     filingNumber, messageId, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.case.overall.status}'}", groupId = "transformer-case")
    public void listenCaseOverallStatus(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        String messageId = extractMessageId(payload);
        String filingNumber = null;
        
        log.info("Received case status message on topic: {} | messageId: {} | partition: {} | offset: {}", 
                topic, messageId, payload.partition(), payload.offset());
        
        try {
            CaseStageSubStage overallStatus = objectMapper.readValue(payload.value().toString(), CaseStageSubStage.class);
            filingNumber = overallStatus.getCaseOverallStatus().getFilingNumber();
            
            log.info("Processing case status update | filingNumber: {}", filingNumber);
            
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(overallStatus.getRequestInfo(), filingNumber);
            JsonNode cases = caseUtil.searchCaseDetails(caseSearchRequest);
            CourtCase courtCase = objectMapper.convertValue(cases, CourtCase.class);
            
            if(courtCase.getCnrNumber() != null) {
                log.info("Found case with CNR: {} for status update | filingNumber: {}", courtCase.getCnrNumber(), filingNumber);
                caseService.processAndUpdateCase(courtCase, overallStatus.getRequestInfo());
                log.info("Successfully processed case status | filingNumber: {} | CNR: {}", filingNumber, courtCase.getCnrNumber());
            } else {
                log.warn("No CNR found for case status | filingNumber: {}", filingNumber);
            }
        } catch (Exception e){
            log.error("Failed to process case status | filingNumber: {} | messageId: {} | error: {}", 
                     filingNumber, messageId, e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "#{'${kafka.topic.case.conversion}'}", groupId = "transformer-case")
    public void listenCaseConversion(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String messageId = extractMessageId(payload);
        String filingNumber = null;

        log.info("Received case conversion message on topic: {} | messageId: {} | partition: {} | offset: {}",
                topic, messageId, payload.partition(), payload.offset());

        try {
            CaseConversionRequest caseConversionRequest = objectMapper.readValue(payload.value().toString(), CaseConversionRequest.class);
            filingNumber = caseConversionRequest.getCaseConversionDetails().getFilingNumber();
            caseService.updateCaseConversionDetails(caseConversionRequest);
            log.info("Successfully processed case conversion | messageId: {} | filingNumber: {}", messageId, filingNumber);
        } catch (Exception e) {
            log.error("Failed to process case conversion | messageId: {} | error: {}", messageId, e.getMessage(), e);
        }
    }
}
