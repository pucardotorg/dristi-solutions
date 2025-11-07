package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.cases.CaseCriteria;
import com.dristi.njdg_transformer.model.cases.CaseRequest;
import com.dristi.njdg_transformer.model.cases.CaseSearchRequest;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.service.CaseService;
import com.dristi.njdg_transformer.utils.CaseUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

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
            log.error("Error in processing message:: {}", e.getMessage());
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
}
