package digit.util;

import digit.web.models.Bail;
import digit.web.models.BailRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import digit.config.Configuration;
import static digit.config.ServiceConstants.*;

@Slf4j
@Component
public class UrlShortenerUtil {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private Configuration configs;


    public String getShortenedUrl(String url, String bailBondId){

        HashMap<String,String> body = new HashMap<>();
        body.put(URL,url);
        body.put(REFERENCE_ID, bailBondId);
        StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
        builder.append(configs.getUrlShortnerEndpoint());
        String res = restTemplate.postForObject(builder.toString(), body, String.class);

        if(StringUtils.isEmpty(res)){
            log.error(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + url); ;
            return url;
        }
        else return res;
    }

    public String createShortenedUrl(String tenantId, String bailBondId) {

        try {
            String baseUrl = configs.getDomainUrl() + configs.getBaseUrl();

            // Build the final long URL with query parameters
            String longUrl = String.format(configs.getLongUrl(), baseUrl, tenantId, bailBondId);

            // Return shortened version
            return getShortenedUrl(longUrl, bailBondId);
        } catch (CustomException e) {
            log.error(URL_SHORTENING_ERROR_CODE + "{}", e.getMessage());
            throw new CustomException(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + e.getMessage());
        }
    }


    public void expireTheUrl(BailRequest bailRequest) {
        Bail bail = bailRequest.getBail();
        String url = bail.getShortenedURL();
        HashMap<String,String> body = new HashMap<>();
        body.put(URL,url);
        body.put(REFERENCE_ID, bail.getBailId());
        StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
        builder.append(configs.getUrlShortenerExpireEndpoint());
        String res = restTemplate.postForObject(builder.toString(), body, String.class);
    }
}