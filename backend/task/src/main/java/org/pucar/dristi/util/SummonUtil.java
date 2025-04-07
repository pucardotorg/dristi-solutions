package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.TaskRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class SummonUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;

    public SummonUtil(Configuration config, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.config = config;
        this.restTemplate = restTemplate;
    }

    public void sendSummons(TaskRequest taskRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getSummonHost()).append(config.getSummonSendSummonPath());
        log.info("Sending summons for {}", taskRequest.getTask().getTaskType());
        Object response = null;
        try {
            response = restTemplate.postForEntity(uri.toString(), taskRequest, Object.class);
            log.info("Summon sent for {}", taskRequest.getTask().getTaskType());
        } catch(Exception e) {
            log.error("Error while sending summons: {}", taskRequest, e);
            throw new CustomException("SUMMONS_SEND_ERROR", "Error occurred while sending summons");
        }
    }
}
