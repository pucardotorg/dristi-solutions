package org.pucar.dristi.evidence_enrichment.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.evidence_enrichment.config.Configuration;
import org.pucar.dristi.evidence_enrichment.models.EvidenceSearchRequest;
import org.pucar.dristi.evidence_enrichment.repository.ServiceRequestRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;


@Component
@Slf4j
public class EvidenceUtil {

    private final Configuration config;
    private final ServiceRequestRepository requestRepository;
    private final ObjectMapper mapper;
    public EvidenceUtil(Configuration config, RestTemplate restTemplate, ObjectMapper objectMapper, ServiceRequestRepository requestRepository, ObjectMapper mapper) {
        this.config = config;
        this.requestRepository = requestRepository;
        this.mapper = mapper;
    }

    public JsonNode getAllEvidence(EvidenceSearchRequest searchRequest) {
        String uri = config.getEvidenceHost() + config.getEvidenceSearchEndpoint();

        Object response = new HashMap<>();
        try {
            response = requestRepository.fetchResult(new StringBuilder(uri), searchRequest);
            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            return jsonNode.get("artifacts");
        } catch (Exception e) {
            log.error("Error while fetching evidence: {}", e.getMessage());
        }
        return null;
    }

}
