package digit.util;

import digit.config.Configuration;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;

import static digit.config.ServiceConstants.*;

@Slf4j
@Component
public class UrlShortenerUtil {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private Configuration configs;


    public String getShortenedUrl(String url, String digitalizedDocumentId){

        HashMap<String,String> body = new HashMap<>();
        body.put(URL,url);
        body.put(REFERENCE_ID, digitalizedDocumentId);
        StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
        builder.append(configs.getUrlShortnerEndpoint());

        try{
            String res = restTemplate.postForObject(builder.toString(), body, String.class);
            if(StringUtils.isEmpty(res)){
                log.error(URL_SHORTENING_ERROR_MESSAGE);
                return url;
            }
            return res;
        } catch (Exception e){
            log.error("Error occurred while calling url shortening service: {}", e.getMessage());
            return url;
        }
    }

    public String createShortenedUrl(String tenantId, String documentNumber, String type) {

        try {
            String baseUrl = configs.getDomainUrl() + configs.getBaseUrl();

            // Build the final long URL with query parameters
            String longUrl = String.format(configs.getLongUrl(), baseUrl, tenantId, documentNumber, type);

            // Return shortened version
            return getShortenedUrl(longUrl, documentNumber);
        } catch (CustomException e) {
            log.error(URL_SHORTENING_ERROR_CODE + "{}", e.getMessage());
            throw new CustomException(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + e.getMessage());
        }
    }

    public void expireTheUrl(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        DigitalizedDocument digitalizedDocument = digitalizedDocumentRequest.getDigitalizedDocument();
        String url = digitalizedDocument.getShortenedUrl();
        HashMap<String,String> body = new HashMap<>();
        body.put(URL,url);
        body.put(REFERENCE_ID, digitalizedDocument.getDocumentNumber());
        StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
        builder.append(configs.getUrlShortenerExpireEndpoint());
        String res = restTemplate.postForObject(builder.toString(), body, String.class);
    }


}
