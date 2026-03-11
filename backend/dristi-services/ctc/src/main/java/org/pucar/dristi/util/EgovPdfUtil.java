package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.CtcApplication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Slf4j
public class EgovPdfUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;
    private final FileStoreUtil fileStoreUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public EgovPdfUtil(Configuration config, RestTemplate restTemplate, FileStoreUtil fileStoreUtil, ObjectMapper objectMapper) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.fileStoreUtil = fileStoreUtil;
        this.objectMapper = objectMapper;
    }

    public String getSealedTemplateFileStoreId(RequestInfo requestInfo, CtcApplication ctcApplication) {
        String tenantId = ctcApplication.getTenantId();
        String courtId = ctcApplication.getCourtId();
        String filingNumber = ctcApplication.getFilingNumber();
        String ctcApplicationNumber = ctcApplication.getCtcApplicationNumber();

        log.info("Calling egov-pdf ctc-certification for ctcApplicationNumber: {}, filingNumber: {}", ctcApplicationNumber, filingNumber);

        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getEgovPdfHost())
                    .append(config.getEgovPdfCtcEndpoint())
                    .append("?tenantId=").append(tenantId)
                    .append("&qrCode=false")
                    .append("&courtId=").append(courtId);

            Map<String, Object> criteria = new LinkedHashMap<>();
            criteria.put("tenantId", tenantId);
            criteria.put("courtId", courtId);
            criteria.put("filingNumber", filingNumber);
            criteria.put("ctcApplicationNumber", ctcApplicationNumber);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("RequestInfo", requestInfo);
            body.put("criteria", criteria);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(uri.toString(), HttpMethod.POST, requestEntity, byte[].class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().length > 0) {
                byte[] pdfBytes = response.getBody();
                log.info("Received sealed template PDF, size: {} bytes", pdfBytes.length);

                ByteArrayMultipartFile multipartFile = new ByteArrayMultipartFile("CtcSealedTemplate.pdf", pdfBytes);
                String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                log.info("Uploaded sealed template PDF to filestore, fileStoreId: {}", fileStoreId);
                return fileStoreId;
            } else {
                throw new CustomException("EGOV_PDF_EMPTY_RESPONSE", "Received empty response from egov-pdf service");
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling egov-pdf ctc-certification for ctcApplicationNumber: {}", ctcApplicationNumber, e);
            throw new CustomException("EGOV_PDF_SERVICE_EXCEPTION", "Error generating sealed CTC template: " + e.getMessage());
        }
    }
}
