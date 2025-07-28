package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.models.project.TaskResponse;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.tasks.TaskListResponse;
import org.pucar.dristi.web.models.tasks.TaskRequest;
import org.pucar.dristi.web.models.tasks.TaskSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class TaskUtil {

    private final ObjectMapper objectMapper;

    private final ServiceRequestRepository serviceRequestRepository;

    private final Configuration config;

    @Autowired
    public TaskUtil(ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository, Configuration config) {
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.config = config;
    }


    public TaskListResponse searchTask(TaskSearchRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskServiceHost()).append(config.getTaskSearchEndpoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskListResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return null;
    }

    public TaskResponse updateTask(TaskRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskServiceHost()).append(config.getTaskUpdateEndpoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return null;
    }

}
