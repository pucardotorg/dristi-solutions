package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;

import java.util.HashMap;

import static pucar.config.ServiceConstants.*;

@Slf4j
@Component
public class UrlShortenerUtil {

    private final RestTemplate restTemplate;
    private final Configuration configs;

    @Autowired
    public UrlShortenerUtil(RestTemplate restTemplate, Configuration configs) {
        this.restTemplate = restTemplate;
        this.configs = configs;
    }

    public String getShortenedUrl(String url, String artifactNumber) {

        HashMap<String, String> body = new HashMap<>();
        body.put(URL, url);
        body.put(REFERENCE_ID, artifactNumber);
        StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
        builder.append(configs.getUrlShortnerEndpoint());
        String res = restTemplate.postForObject(builder.toString(), body, String.class);

        if (StringUtils.isEmpty(res)) {
            log.error(URL_SHORTENING_ERROR_CODE + " " + URL_SHORTENING_ERROR_MESSAGE + url);
            return url;
        } else
            return res;
    }

    public String createShortenedUrl(String tenantId, String referenceId, String orderNumber, String orderItemId) {

        try {
            String baseUrl = configs.getDomainUrl() + configs.getBaseUrl();

            // Build the final long URL with query parameters
            StringBuilder longUrlBuilder = new StringBuilder();
            longUrlBuilder.append(baseUrl)
                    .append("?tenantId=").append(tenantId)
                    .append("&referenceId=").append(referenceId)
                    .append("&orderNumber=").append(orderNumber);
            
            // Add orderItemId only if it's present
            if (StringUtils.isNotEmpty(orderItemId)) {
                longUrlBuilder.append("&orderItemId=").append(orderItemId);
            }
            
            String longUrl = longUrlBuilder.toString();

            // Return shortened version
            return getShortenedUrl(longUrl, referenceId);
        } catch (CustomException e) {
            log.error(URL_SHORTENING_ERROR_CODE + "{}", e.getMessage());
            throw new CustomException(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + e.getMessage());
        }
    }


}