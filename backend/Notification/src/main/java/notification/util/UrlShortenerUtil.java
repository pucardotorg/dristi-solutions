package notification.util;

import lombok.extern.slf4j.Slf4j;
import notification.config.Configuration;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;

import static notification.config.ServiceConstants.*;

@Slf4j
@Component
public class UrlShortenerUtil {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private Configuration configs;


    public String getShortenedUrl(String url) {

        HashMap<String, String> body = new HashMap<>();
        body.put(URL, url);
        String res = restTemplate.postForObject(configs.getUrlShortnerHost() + configs.getUrlShortnerEndpoint(), body, String.class);

        if (StringUtils.isEmpty(res)) {
            log.error(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + url);
            return url;
        } else return res;
    }


}