package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.model.EPostTrackerPdfRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class PdfServiceUtil {

    private final EPostConfiguration config;

    private final RestTemplate restTemplate;

    @Autowired
    public PdfServiceUtil(EPostConfiguration config, RestTemplate restTemplate) {
        this.config = config;
        this.restTemplate = restTemplate;
    }

    public byte[] generatePdf(EPostTrackerPdfRequest ePostTrackerPdfRequest, String tenantId, String pdfTemplateKey) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getPdfServiceHost())
                    .append(config.getPdfServiceEndpoint())
                    .append("?tenantId=").append(tenantId).append("&key=").append(pdfTemplateKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<EPostTrackerPdfRequest> requestEntity = new HttpEntity<>(ePostTrackerPdfRequest, headers);

            ResponseEntity<byte[]> responseEntity = restTemplate.postForEntity(uri.toString(), requestEntity, byte[].class);

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Pdf Service", e);
            return null;
        }
    }

}
