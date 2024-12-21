package org.pucar.dristi.evidence_enrichment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.evidence_enrichment.config.Configuration;
import org.pucar.dristi.evidence_enrichment.kafka.Producer;
import org.pucar.dristi.evidence_enrichment.models.Artifact;
import org.pucar.dristi.evidence_enrichment.models.EvidenceRequest;
import org.pucar.dristi.evidence_enrichment.models.EvidenceSearchRequest;
import org.pucar.dristi.evidence_enrichment.util.EvidenceUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static org.pucar.dristi.evidence_enrichment.config.ServiceConstants.APPLICATION;

@Service
@Slf4j
public class EvidenceEnrichmentService {

    private final EvidenceUtil util;
    private final ObjectMapper objectMapper;
    private final Producer producer;
    private final Configuration config;
    public EvidenceEnrichmentService(EvidenceUtil util, ObjectMapper objectMapper, Producer producer, Configuration config) {
        this.util = util;
        this.objectMapper = objectMapper;
        this.producer = producer;
        this.config = config;
    }

    public List<Artifact> enrichExistingEvidence(EvidenceSearchRequest searchRequest) {
        List<Artifact> updatedArtifacts = new ArrayList<>();
        try {
            JsonNode evidenceResponse = util.getAllEvidence(searchRequest);
            for(JsonNode artifact : evidenceResponse) {
                Artifact artifact1 = objectMapper.treeToValue(artifact, Artifact.class);
                if(artifact1.getApplication() != null) {
                    artifact1.setFilingType(APPLICATION);
                    updatedArtifacts.add(artifact1);
                    EvidenceRequest evidenceRequest = EvidenceRequest.builder()
                            .artifact(artifact1)
                            .build();
                    producer.push(config.getEvidenceKafkaUpdateWithoutWorkflowTopic(), evidenceRequest);
                }
            }

        } catch(JsonProcessingException e) {
            log.error("Error while processing evidence: {}", e.getMessage());
        }
        return updatedArtifacts;
    }
}
