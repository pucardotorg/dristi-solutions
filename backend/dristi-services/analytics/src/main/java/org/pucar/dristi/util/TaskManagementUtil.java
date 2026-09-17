package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.taskManagement.TaskManagement;
import org.pucar.dristi.web.models.taskManagement.TaskManagementSearchResponse;
import org.pucar.dristi.web.models.taskManagement.TaskSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class TaskManagementUtil {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final JsonUtil jsonUtil;
    private final Configuration config;
    private final Producer producer;

    @Autowired
    public TaskManagementUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, JsonUtil jsonUtil, Configuration config, Producer producer) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.jsonUtil = jsonUtil;
        this.config = config;
        this.producer = producer;
    }

    public List<TaskManagement> searchTaskManagement(TaskSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskManagementServiceHost())
                .append(config.getTaskManagementSearchEndpoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        try {
            TaskManagementSearchResponse searchResponse = objectMapper.convertValue(response, TaskManagementSearchResponse.class);
            if (searchResponse != null && searchResponse.getTaskManagementRecords() != null) {
                return searchResponse.getTaskManagementRecords();
            } else {
                return Collections.emptyList();
            }
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException("TASK_SEARCH_ERROR", "Error occurred while fetching task management records");
        }
    }

}

