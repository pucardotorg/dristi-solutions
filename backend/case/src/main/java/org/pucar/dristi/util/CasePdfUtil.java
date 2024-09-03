package org.pucar.dristi.util;


import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.CaseRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;


import static org.pucar.dristi.config.ServiceConstants.CASE_PDF_UTILITY_EXCEPTION;

@Component
@Slf4j
public class CasePdfUtil {

    private final RestTemplate restTemplate;

    @Autowired
    public CasePdfUtil(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public ByteArrayResource generateCasePdf(CaseRequest caseRequest, StringBuilder uri) {
        try {
            HttpEntity<CaseRequest> requestEntity = new HttpEntity<>(caseRequest);

            ResponseEntity<ByteArrayResource> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, ByteArrayResource.class);

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error generating PDF for case {}: {}", caseRequest, e.getMessage());
            throw new CustomException(CASE_PDF_UTILITY_EXCEPTION, "Error generating PDF for case: " + e.getMessage());
        }
    }
}
