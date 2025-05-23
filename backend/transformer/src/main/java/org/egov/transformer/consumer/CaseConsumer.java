package org.egov.transformer.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.models.AuditDetails;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.*;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.repository.CourtIdRepository;
import org.egov.transformer.service.CaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class CaseConsumer {

    private static final Logger logger = LoggerFactory.getLogger(CaseConsumer.class);

    private final ObjectMapper objectMapper;
    private final TransformerProducer producer;
    private final TransformerProperties transformerProperties;
    private final CaseService caseService;
    private final CourtIdRepository courtIdRepository;

    @Autowired
    public CaseConsumer(ObjectMapper objectMapper,
                        TransformerProducer producer,
                        TransformerProperties transformerProperties, CaseService caseService, CourtIdRepository courtIdRepository) {
        this.objectMapper = objectMapper;
        this.producer = producer;
        this.transformerProperties = transformerProperties;
        this.caseService = caseService;
        this.courtIdRepository = courtIdRepository;
    }

    @KafkaListener(topics = {"${transformer.consumer.create.case.topic}"})
    public void saveCase(ConsumerRecord<String, Object> payload,
                         @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishCase(payload, transformerProperties.getSaveCaseTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.update.case.topic}"})
    public void updateCase(ConsumerRecord<String, Object> payload,
                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishCase(payload, transformerProperties.getUpdateCaseTopic());

        try {
            logger.info("Checking case status for enriching courtId");
            CourtCase courtCase = (objectMapper.readValue((String) payload.value(), new TypeReference<CaseRequest>() {
            })).getCases();
            logger.info("Current case status ::{}",courtCase.getStatus());

            if ("PENDING_REGISTRATION".equalsIgnoreCase(courtCase.getStatus())) {
                courtIdRepository.updateCourtIdForFilingNumber(courtCase.getCourtId(), courtCase.getFilingNumber());
            }
        } catch (Exception exception) {
            log.error("error in saving case", exception);
        }
    }

    @KafkaListener(topics = {"${transformer.consumer.case.status.update.topic}"})
    public void updateCaseStatus(ConsumerRecord<String, Object> payload,
                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishCase(payload, transformerProperties.getUpdateCaseTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.join.case.kafka.topic}"})
    public void updateJoinCase(ConsumerRecord<String, Object> payload,
                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishCase(payload, transformerProperties.getUpdateCaseTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.case.overall.status.topic}"})
    public void updateCaseOverallStatus(ConsumerRecord<String, Object> payload,
                                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        fetchAndPublishCaseForOverAllStatus(payload, transformerProperties.getUpdateCaseTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.edit.case.topic}"})
    public void editCase(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        fetchAndPublishEditCase(payload, transformerProperties.getUpdateCaseTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.case.outcome.topic}"})
    public void updateCaseOutcome(ConsumerRecord<String, Object> payload,
                                  @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        fetchAndPublishCaseForOutcome(payload, transformerProperties.getUpdateCaseTopic());
    }

    private void publishCase(ConsumerRecord<String, Object> payload,
                             @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            CourtCase courtCase = (objectMapper.readValue((String) payload.value(), new TypeReference<CaseRequest>() {
            })).getCases();
            logger.info("Received Object: {} ", objectMapper.writeValueAsString(courtCase));
            CourtCase existingCourtCase = caseService.fetchCase(courtCase.getFilingNumber());
            courtCase.setDates();
            if(null != existingCourtCase) {
                if(null != existingCourtCase.getBailOrderDetails()) {
                    courtCase.setBailOrderDetails(existingCourtCase.getBailOrderDetails());
                }
                if(null != existingCourtCase.getJudgementOrderDetails()) {
                    courtCase.setJudgementOrderDetails(existingCourtCase.getJudgementOrderDetails());
                }
            }
            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setCases(courtCase);
            logger.info("Transformed Object: {} ", objectMapper.writeValueAsString(courtCase));
            // TODO : currently some topics are missing in indexer files
            producer.push(topic, caseRequest);
            pushToLegacyTopic(courtCase);
        } catch (Exception exception) {
            log.error("error in saving case", exception);
        }
    }

    private void fetchAndPublishCaseForOverAllStatus(ConsumerRecord<String, Object> payload, String updateCaseTopic) {
        try {
            CaseOverallStatus caseOverallStatus = (objectMapper.readValue((String) payload.value(), new TypeReference<CaseStageSubStage>() {
            })).getCaseOverallStatus();
            logger.info("Received Object: {} ", objectMapper.writeValueAsString(caseOverallStatus));
            CourtCase courtCase = caseService.fetchCase(caseOverallStatus.getFilingNumber());
            courtCase.setDates();
            courtCase.setStage(caseOverallStatus.getStage());
            courtCase.setSubstage(caseOverallStatus.getSubstage());
            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setCases(courtCase);
            logger.info("Transformed Object: {} ", objectMapper.writeValueAsString(courtCase));
            producer.push(updateCaseTopic, caseRequest);
            pushToLegacyTopic(courtCase);
        } catch (Exception exception) {
            log.error("error in saving case", exception);
        }
    }

    private void fetchAndPublishEditCase(ConsumerRecord<String, Object> payload, String updateCaseTopic) {
        try {
            CaseRequest caseRequest = (objectMapper.readValue((String) payload.value(), new TypeReference<CaseRequest>() {}));
            logger.info("Received Object: {} ", objectMapper.writeValueAsString(caseRequest.getCases()));
            CourtCase courtCaseElasticSearch = caseService.fetchCase(caseRequest.getCases().getFilingNumber());
            courtCaseElasticSearch.setAdditionalDetails(caseRequest.getCases().getAdditionalDetails());
            courtCaseElasticSearch.setCaseTitle(caseRequest.getCases().getCaseTitle());

            AuditDetails auditDetails = courtCaseElasticSearch.getAuditdetails();
            auditDetails.setLastModifiedTime(caseRequest.getCases().getAuditdetails().getLastModifiedTime());
            auditDetails.setLastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid());
            courtCaseElasticSearch.setAuditdetails(auditDetails);

            CaseRequest updatedElasticSearchCaseRequest = new CaseRequest();
            updatedElasticSearchCaseRequest.setCases(courtCaseElasticSearch);
            logger.info("Transformed Object: {} ", objectMapper.writeValueAsString(courtCaseElasticSearch));
            producer.push(updateCaseTopic, updatedElasticSearchCaseRequest);
            pushToLegacyTopic(courtCaseElasticSearch);
        } catch (Exception exception) {
            log.error("error in saving case", exception);
        }
    }

    private void fetchAndPublishCaseForOutcome(ConsumerRecord<String, Object> payload, String updateCaseTopic) {
        try {
            Outcome outcome = (objectMapper.readValue((String) payload.value(), new TypeReference<CaseOutcome>() {
            })).getOutcome();
            logger.info("Received Object: {} ", objectMapper.writeValueAsString(outcome));
            CourtCase courtCase = caseService.fetchCase(outcome.getFilingNumber());
            courtCase.setDates();
            courtCase.setOutcome(outcome.getOutcome());
            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setCases(courtCase);
            logger.info("Transformed Object: {} ", objectMapper.writeValueAsString(courtCase));
            producer.push(updateCaseTopic, caseRequest);
            pushToLegacyTopic(courtCase);
        } catch (Exception exception) {
            log.error("error in saving case", exception);
        }
    }

    private void pushToLegacyTopic(CourtCase courtCase) {
        CaseResponse caseResponse = new CaseResponse();
        List<CaseCriteria> caseCriteriaList = new ArrayList<>();
        CaseCriteria caseCriteria = new CaseCriteria();
        List<CourtCase> courtCaseList = new ArrayList<>();
        courtCaseList.add(courtCase);
        caseCriteria.setResponseList(courtCaseList);
        caseCriteria.setCaseId(String.valueOf(courtCase.getId()));
        caseCriteriaList.add(caseCriteria);
        caseResponse.setCriteria(caseCriteriaList);
        producer.push("case-legacy-topic", caseResponse);
    }
}
