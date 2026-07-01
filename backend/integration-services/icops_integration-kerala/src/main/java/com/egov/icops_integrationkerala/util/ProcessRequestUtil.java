package com.egov.icops_integrationkerala.util;

import com.egov.icops_integrationkerala.config.IcopsConfiguration;
import com.egov.icops_integrationkerala.model.AuthResponse;
import com.egov.icops_integrationkerala.model.ChannelMessage;
import com.egov.icops_integrationkerala.model.ProcessRequest;
import com.egov.icops_integrationkerala.model.RescheduleProcessRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class ProcessRequestUtil {

    private final RestTemplate restTemplate;

    private final IcopsConfiguration config;

    private final ObjectMapper objectMapper;

    @Autowired
    public ProcessRequestUtil(RestTemplate restTemplate, IcopsConfiguration config, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    public ChannelMessage callProcessRequest(AuthResponse authResponse, ProcessRequest processRequest) throws Exception {
        String icopsUrl = config.getIcopsUrl() + config.getProcessRequestEndPoint();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + authResponse.getAccessToken());
        HttpEntity<ProcessRequest> requestEntity = new HttpEntity<>(processRequest, headers);

        try {
            log.info("Process request: processUniqueId={}, processCaseno={}, hasDoc={}",
                    processRequest.getProcessUniqueId(), processRequest.getProcessCaseno(),
                    processRequest.getProcessDoc() != null);
            // Send the request and get the response
            ResponseEntity<Object> responseEntity =
                    restTemplate.postForEntity(icopsUrl, requestEntity, Object.class);
            // Print the response body and status code
            log.info("Status Code: {}", responseEntity.getStatusCode());
            log.info("Response Body: {}", responseEntity.getBody());
            return parseChannelMessage(responseEntity.getBody(), "Process");
        } catch (RestClientException e) {
            log.error("Error occurred when sending Process Request ", e);

            return ChannelMessage.builder().acknowledgementStatus("FAILURE").failureMsg("Failed to connect to ICOPS").build();
        }
    }

    public ChannelMessage callRescheduleRequest(AuthResponse authResponse, RescheduleProcessRequest rescheduleRequest) throws Exception {
        String icopsUrl = config.getIcopsUrl() + config.getRescheduleRequestEndPoint();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + authResponse.getAccessToken());
        HttpEntity<RescheduleProcessRequest> requestEntity = new HttpEntity<>(rescheduleRequest, headers);

        try {
            log.info("Reschedule request: processUniqueId={}, processNextHearingDate={}, hasDoc={}",
                    rescheduleRequest.getProcessUniqueId(), rescheduleRequest.getProcessNextHearingDate(),
                    rescheduleRequest.getProcessDoc() != null);
            ResponseEntity<Object> responseEntity =
                    restTemplate.postForEntity(icopsUrl, requestEntity, Object.class);
            log.info("Reschedule Status Code: {}", responseEntity.getStatusCode());
            log.info("Reschedule Response Body: {}", responseEntity.getBody());
            return parseChannelMessage(responseEntity.getBody(), "Reschedule");
        } catch (RestClientException e) {
            log.error("Error occurred when sending Reschedule Request ", e);
            return ChannelMessage.builder().acknowledgementStatus("FAILURE").failureMsg("Failed to connect to ICOPS").build();
        }
    }

    private ChannelMessage parseChannelMessage(Object body, String context) {
        if (body == null) {
            log.error("{} response body is null", context);
            return ChannelMessage.builder().acknowledgementStatus("FAILURE")
                    .failureMsg("Empty response from ICOPS").build();
        }
        try {
            return objectMapper.convertValue(body, ChannelMessage.class);
        } catch (IllegalArgumentException e) {
            log.error("{} response could not be mapped to ChannelMessage: {}", context, e.getMessage());
            return ChannelMessage.builder().acknowledgementStatus("FAILURE")
                    .failureMsg("Malformed response from ICOPS").build();
        }
    }
}
