package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.EvidenceRequest;
import org.pucar.dristi.web.models.EvidenceSearchRequest;
import org.pucar.dristi.web.models.EvidenceSearchResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.EVIDENCE_CREATE_ERROR;

@Slf4j
@Component
public class EvidenceUtil {

    private final RestTemplate restTemplate;
    private final Configuration config;

    @Autowired
    public EvidenceUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public void createEvidence(EvidenceRequest evidenceRequest) {

        StringBuilder uri = new StringBuilder();
        uri.append(config.getEvidenceServiceHost()).append(config.getEvidenceServiceCreatePath());
        try {
            restTemplate.postForEntity(uri.toString(), evidenceRequest, String.class);
        } catch (Exception e) {
            log.error("Error getting response from Evidence Service", e);
            throw new CustomException(EVIDENCE_CREATE_ERROR, "Error getting response from Evidence Service");
        }
    }

    public EvidenceSearchResponse searchEvidence(EvidenceSearchRequest evidenceSearchRequest) {

        StringBuilder uri = new StringBuilder();
        uri.append(config.getEvidenceServiceHost()).append(config.getEvidenceServiceSearchPath());
        try {
            return restTemplate.postForObject(uri.toString(), evidenceSearchRequest, EvidenceSearchResponse.class);
        } catch (Exception e) {
            log.error("Error getting response from Evidence Service", e);
            throw new CustomException(EVIDENCE_CREATE_ERROR, "Error getting response from Evidence Service");
        }

    }

}
