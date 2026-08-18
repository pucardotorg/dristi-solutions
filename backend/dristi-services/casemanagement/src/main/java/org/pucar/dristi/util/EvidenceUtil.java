package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
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

import java.util.ArrayList;
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

    public List<Artifact> searchEvidence(String filingNumber, String courtId, String tenantId, RequestInfo requestInfo) {

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
                .requestInfo(requestInfo)
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

    /**
     * Fetches evidence specifically for the ADDITIONAL_FILINGS section.
     * Makes two calls: filingType=DIRECT and filingType=APPLICATION, both with evidenceStatus=false,
     * matching the UI's data fetching for this section.
     */
    public List<Artifact> searchAdditionalFilingEvidence(String filingNumber, String courtId, String tenantId, RequestInfo requestInfo) {
        List<Artifact> direct = searchEvidenceByFilingType(filingNumber, courtId, tenantId, "DIRECT", requestInfo);
        List<Artifact> application = searchEvidenceByFilingType(filingNumber, courtId, tenantId, "APPLICATION", requestInfo);

        List<Artifact> combined = new ArrayList<>(direct);
        combined.addAll(application);
        return combined;
    }

    private List<Artifact> searchEvidenceByFilingType(String filingNumber, String courtId, String tenantId, String filingType, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getEvidenceServiceHost()).append(configuration.getEvidenceServiceSearchEndpoint());
        EvidenceSearchCriteria criteria = EvidenceSearchCriteria.builder()
                .filingNumber(filingNumber)
                .courtId(courtId)
                .isVoid(false)
                .tenantId(tenantId)
                .filingType(filingType)
                .evidenceStatus(false)
                .isHideBailCaseBundle(true)
                .build();
        EvidenceSearchRequest evidenceSearchRequest = EvidenceSearchRequest.builder()
                .criteria(criteria)
                .requestInfo(requestInfo)
                .pagination(Pagination.builder().sortBy("createdTime").order(OrderPagination.ASC).limit(100).build())
                .build();

        try {
            Object response = restTemplate.postForObject(uri.toString(), evidenceSearchRequest, Map.class);
            EvidenceSearchResponse evidenceSearchResponse = mapper.convertValue(response, EvidenceSearchResponse.class);
            List<Artifact> artifacts = evidenceSearchResponse.getArtifacts();
            return artifacts != null ? artifacts : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error while searching for {} evidence", filingType, e);
            return Collections.emptyList();
        }
    }
}
