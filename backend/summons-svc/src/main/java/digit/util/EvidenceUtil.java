package digit.util;

import digit.config.Configuration;
import digit.web.models.EvidenceRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class EvidenceUtil {

    private final RestTemplate restTemplate;

    private final Configuration configuration;

    public EvidenceUtil(RestTemplate restTemplate, Configuration configuration) {
        this.restTemplate = restTemplate;
        this.configuration = configuration;
    }

    public void createEvidence(EvidenceRequest request) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(configuration.getEvidenceHost()).append(configuration.getEvidenceCreateEndpoint());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<EvidenceRequest> requestBody = new HttpEntity<>(request, headers);

            ResponseEntity<Object> evidence = restTemplate.postForEntity(uri.toString(), requestBody, Object.class);
            log.info("Evidence created : {}", evidence.getBody());
        } catch (RestClientException e) {
            log.error("Error getting response from Evidence Service", e);
            throw new CustomException("EVIDENCE_CREATE_ERROR", "Error getting response from evidence Service");
        }
    }
}