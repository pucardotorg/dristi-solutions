package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.esign.ESignRequest;
import org.pucar.dristi.web.models.esign.ESignResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Enumeration;
import java.util.Map;

@Component
@Slf4j
public class ESignUtil {
    private final Configuration configs;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    @Autowired
    public ESignUtil(RestTemplate restTemplate, Configuration configs, ObjectMapper mapper) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.mapper = mapper;
    }

    public ESignResponse callESignService(ESignRequest eSignRequest, HttpServletRequest servletRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getESignHost());
        uri.append(configs.getESignEndpoint());

        ESignResponse eSignResponse = null;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Forward all headers from the incoming servletRequest
            Enumeration<String> headerNames = servletRequest.getHeaderNames();
            if (headerNames != null) {
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    Enumeration<String> headerValues = servletRequest.getHeaders(headerName);
                    while (headerValues.hasMoreElements()) {
                        String headerValue = headerValues.nextElement();
                        headers.add(headerName, headerValue);
                    }
                }
            }

            HttpEntity<ESignRequest> entity = new HttpEntity<>(eSignRequest, headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    uri.toString(),
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            Map response = responseEntity.getBody();

            eSignResponse = mapper.convertValue(response, ESignResponse.class);
            log.info("eSign response :: {}", eSignResponse);
        } catch (Exception e) {
            log.error("Error while fetching from eSign service", e);
            throw new CustomException("ESIGN_SERVICE_ERROR", e.getMessage());
        }

        return eSignResponse;
    }

}


