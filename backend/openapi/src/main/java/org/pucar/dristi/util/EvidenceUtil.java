package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.witnessdeposition.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class EvidenceUtil {

    private final Configuration configuration;

    private final RestTemplate restTemplate;

    private final ObjectMapper mapper;

    @Autowired
    public EvidenceUtil(Configuration configuration, RestTemplate restTemplate, ObjectMapper mapper) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }

    public EvidenceSearchResponse searchEvidence(EvidenceSearchCriteria criteria, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getEvidenceServiceHost()).append(configuration.getEvidenceServiceSearchEndpoint());

        EvidenceSearchRequest evidenceSearchRequest = EvidenceSearchRequest.builder()
                .requestInfo(requestInfo)
                .tenantId(criteria.getTenantId())
                .criteria(criteria)
                .build();

        Object response;
        EvidenceSearchResponse evidenceSearchResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), evidenceSearchRequest, Map.class);
            evidenceSearchResponse = mapper.convertValue(response, EvidenceSearchResponse.class);
            log.info("Evidence response :: {}", evidenceSearchResponse);
            return evidenceSearchResponse;
        } catch (Exception e) {
            log.error("Error while searching for evidence", e);
            throw new CustomException("EVIDENCE_SERVICE_ERROR", e.getMessage());
        }
    }

    public EvidenceResponse updateEvidence(Artifact artifact, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getEvidenceServiceHost()).append(configuration.getEvidenceServiceUpdateEndpoint());

        EvidenceRequest artifactRequest = EvidenceRequest.builder()
                .requestInfo(requestInfo)
                .artifact(artifact)
                .build();

        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), artifactRequest, Map.class);
            return mapper.convertValue(response, EvidenceResponse.class);
        } catch (Exception e) {
            log.error("Error while updating evidence", e);
            throw new CustomException("EVIDENCE_SERVICE_ERROR", e.getMessage());
        }
    }
}