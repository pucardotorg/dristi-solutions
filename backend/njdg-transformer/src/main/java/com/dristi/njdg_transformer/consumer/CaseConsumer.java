package com.dristi.njdg_transformer.consumer;

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
        try {
            log.info("Received message:: {} on topic:: {} ", payload.value(), topic);
            processAndUpdateCase(payload);
            log.info("Message processed successfully on topic:: {}", topic);
        } catch (Exception e){
            log.error("Error in processing case message:: {}", e.getMessage());
        }

    }

    private void processAndUpdateCase(ConsumerRecord<String, Object> payload) {
        try {
            CaseRequest caseRequest = objectMapper.readValue(payload.value().toString(), CaseRequest.class);
            String status = caseRequest.getCourtCase().getStatus();
            if(caseStatus.contains(status)){
                CaseSearchRequest caseSearchRequest = createCaseSearchRequest(caseRequest.getRequestInfo(), caseRequest.getCourtCase().getFilingNumber());
                JsonNode cases = caseUtil.searchCaseDetails(caseSearchRequest);
                CourtCase courtCase = objectMapper.convertValue(cases, CourtCase.class);
                caseService.processAndUpdateCase(courtCase, caseRequest.getRequestInfo());
            }
        } catch (Exception e) {
            log.error("Error in updating case: ", e);
        }
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
        try {
            log.info("Received message:: {} on topic:: {} ", payload.value(), topic);
            processAndUpdateJoinCase(payload);
            log.info("Message processed successfully on topic:: {}", topic);
        } catch (Exception e){
            log.error("Error in processing join case message:: {}", e.getMessage());
        }

    }

    private void processAndUpdateJoinCase(ConsumerRecord<String, Object> payload) {
        try {
            CourtCase courtCase = objectMapper.readValue(payload.value().toString(), CourtCase.class);
            String filingNumber = courtCase.getFilingNumber();
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
            caseService.processAndUpdateCase(courtCases, requestInfo);
        } catch (Exception e) {
            log.error("Error in processing join case message:: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "case-outcome-topic", groupId = "transformer-case")
    public void listenCaseOutcome(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message:: {} on topic:: {} ", payload.value(), topic);
            CaseOutcome outcome = objectMapper.readValue(payload.value().toString(), CaseOutcome.class);
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(outcome.getRequestInfo(), outcome.getOutcome().getFilingNumber());
            JsonNode cases = caseUtil.searchCaseDetails(caseSearchRequest);
            CourtCase courtCase = objectMapper.convertValue(cases, CourtCase.class);
            courtCase.setJudgementDate(outcome.getOutcome().getAuditDetails().getCreatedTime());
            caseService.processAndUpdateCase(courtCase, outcome.getRequestInfo());
            log.info("Message processed successfully on topic:: {}", topic);
        } catch (Exception e){
            log.error("Error in processing case outcome message:: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "case-overall-status-topic", groupId = "transformer-case")
    public void listenCaseOverallStatus(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        try {
            log.info("Received message:: {} on topic:: {} ", payload.value(), topic);
            CaseStageSubStage overallStatus = objectMapper.readValue(payload.value().toString(), CaseStageSubStage.class);
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(overallStatus.getRequestInfo(), overallStatus.getCaseOverallStatus().getFilingNumber());
            JsonNode cases = caseUtil.searchCaseDetails(caseSearchRequest);
            CourtCase courtCase = objectMapper.convertValue(cases, CourtCase.class);
            caseService.processAndUpdateCase(courtCase, overallStatus.getRequestInfo());
            log.info("Message processed successfully on topic:: {}", topic);
        } catch (Exception e){
            log.error("Error in processing case status message:: {}", e.getMessage());
        }
    }
}
