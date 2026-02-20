package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;

@Component
@Slf4j
public class PdfServiceUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;

    @Autowired
    public PdfServiceUtil(Configuration config, RestTemplate restTemplate) {
        this.config = config;
        this.restTemplate = restTemplate;
    }

    /**
     * Generates a PDF by calling the PDF service
     * @param request The request object to be sent to PDF service
     * @param tenantId The tenant ID
     * @param pdfTemplateKey The PDF template key
     * @return byte array of the generated PDF
     */
    public byte[] generatePdf(Object request, String tenantId, String pdfTemplateKey) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getPdfServiceHost())
                    .append(config.getPdfServiceEndpoint())
                    .append("?tenantId=").append(tenantId)
                    .append("&key=").append(pdfTemplateKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Object> requestEntity = new HttpEntity<>(request, headers);

            ResponseEntity<byte[]> responseEntity = restTemplate.postForEntity(uri.toString(), requestEntity, byte[].class);

            log.info("PDF generated successfully, size: {} bytes", responseEntity.getBody() != null ? responseEntity.getBody().length : 0);
            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from PDF Service", e);
            return null;
        }
    }
}
