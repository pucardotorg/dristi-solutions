package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.PendingTaskRequest;
import org.pucar.dristi.web.models.PendingTaskResponse;
import org.pucar.dristi.web.models.task.TaskRequest;
import org.pucar.dristi.web.models.task.TaskResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class AnalyticsUtil {

    private final RestTemplate restTemplate;

    private final Configuration config;

    public AnalyticsUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public PendingTaskResponse createPendingTask(PendingTaskRequest pendingTaskRequest) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getAnalyticsServiceHost()).append(config.getAnalyticsServicePath());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PendingTaskRequest> requestEntity = new HttpEntity<>(pendingTaskRequest, headers);

            ResponseEntity<PendingTaskResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, PendingTaskResponse.class);
            log.info("Response of create pending task :: {}",requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from analytics Service", e);
            throw new CustomException("CREATE_PENDING_TASK_ERROR", "Error getting response from analytics Service");
        }
    }
}
