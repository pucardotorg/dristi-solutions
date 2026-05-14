package org.egov.transformer.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.*;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.service.CaseService;
import org.egov.transformer.service.HearingService;
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
public class EvidenceConsumer {

    private static final Logger logger = LoggerFactory.getLogger(EvidenceConsumer.class);

    private final ObjectMapper objectMapper;
    private final TransformerProducer producer;
    private final TransformerProperties transformerProperties;
    private final CaseService caseService;
    private final HearingService hearingService;

    @Autowired
    public EvidenceConsumer(ObjectMapper objectMapper,
                            TransformerProducer producer,
                            TransformerProperties transformerProperties,
                            CaseService caseService,
                            HearingService hearingService) {
        this.objectMapper = objectMapper;
        this.producer = producer;
        this.transformerProperties = transformerProperties;
        this.caseService = caseService;
        this.hearingService = hearingService;
    }

    @KafkaListener(topics = {"${transformer.consumer.save.artifact.topic}",
            "${transformer.consumer.save.withoutworkflow.artifact.topic}"})
    public void saveArtifact(ConsumerRecord<String, Object> payload,
                             @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishArtifact(payload, topic);
    }

    private void publishArtifact(ConsumerRecord<String, Object> payload, String targetTopic) {
        try {

            EvidenceRequest evidenceRequest = objectMapper.readValue((String) payload.value(), EvidenceRequest.class);
            Artifact artifact = evidenceRequest.getArtifact();

            logger.info("Parsed Artifact with filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId());

            enrichArtifactIndex(artifact, evidenceRequest.getRequestInfo());

            producer.push(transformerProperties.getOpenArtifactIndexTopic(), artifact);
        } catch (Exception e) {
            logger.error("Unexpected error while processing artifact from topic: {}, payload: {}", targetTopic, payload.value(), e);
        }
    }

    private void enrichArtifactIndex(Artifact artifact, RequestInfo requestInfo) {
        try {
            logger.info("Enriching artifact for filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId());

            CourtCase courtCase = caseService.getCase(artifact.getFilingNumber(), artifact.getTenantId(), requestInfo);
            if (courtCase == null) {
                logger.error("No CourtCase found for filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId());
                return;
            }

            artifact.setCaseTitle(courtCase.getCaseTitle());
            artifact.setCaseNumber(getCaseReferenceNumber(courtCase));
            logger.info("Court case enrichment successful: caseTitle={}, caseNumber={}", artifact.getCaseTitle(), artifact.getCaseNumber());

            try {
                List<AdvocateMapping> representatives = courtCase.getRepresentatives();
                Advocate advocate = hearingService.getAdvocates(representatives, courtCase.getLitigants(), requestInfo);
                artifact.setAdvocate(advocate);
                logger.info("Advocate enrichment successful: Complainant: {}, Accused: {}", advocate.getComplainant() != null ? advocate.getComplainant() : "No  complainant found", advocate.getAccused() != null ? advocate.getAccused() : "No advocate found");
            } catch (Exception e) {
                logger.error("Error while fetching advocate details for caseId: {}", courtCase.getId(), e);
            }

            // Populate searchable fields
            List<String> searchableFields = new ArrayList<>();
            if (artifact.getCaseTitle() != null) searchableFields.add(artifact.getCaseTitle());
            if (artifact.getCaseNumber() != null) searchableFields.add(artifact.getCaseNumber());
            if (artifact.getArtifactNumber() != null) searchableFields.add(artifact.getArtifactNumber());
            artifact.setSearchableFields(searchableFields);

        } catch (Exception e) {
            logger.error("Failed to enrich artifact for filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId(), e);
        }
    }

    private String getCaseReferenceNumber(CourtCase courtCase) {
        if (courtCase.getCourtCaseNumber() != null && !courtCase.getCourtCaseNumber().isEmpty()) {
            return courtCase.getCourtCaseNumber();
        } else if (courtCase.getCmpNumber() != null && !courtCase.getCmpNumber().isEmpty()) {
            return courtCase.getCmpNumber();
        } else {
            return courtCase.getFilingNumber();
        }
    }
}
