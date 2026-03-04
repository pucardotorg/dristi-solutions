package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.OrderPagination;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.evidence.EvidenceSearchCriteria;
import org.pucar.dristi.web.models.evidence.EvidenceSearchRequest;
import org.pucar.dristi.web.models.evidence.EvidenceSearchResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
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

    public List<Artifact> searchEvidence(String filingNumber, String courtId, String tenantId) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getEvidenceServiceHost()).append(configuration.getEvidenceServiceSearchEndpoint());
        EvidenceSearchCriteria criteria = EvidenceSearchCriteria.builder()
                .filingNumber(filingNumber)
                .courtId(courtId)
                .isVoid(false)
                .tenantId(tenantId)
                .isHideBailCaseBundle(true)
                .build();
        EvidenceSearchRequest evidenceSearchRequest = EvidenceSearchRequest.builder()
                .criteria(criteria)
                .pagination(Pagination.builder().sortBy("createdTime").order(OrderPagination.ASC).limit(100).build())
                .build();

        Object response;
        EvidenceSearchResponse evidenceSearchResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), evidenceSearchRequest, Map.class);
            evidenceSearchResponse = mapper.convertValue(response, EvidenceSearchResponse.class);
            log.info("Evidence response :: {}", evidenceSearchResponse);
            List<Artifact> artifacts = evidenceSearchResponse.getArtifacts();
            return artifacts != null ? artifacts : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error while searching for evidence", e);
            throw new CustomException("EVIDENCE_SERVICE_ERROR", e.getMessage());
        }
    }
}
