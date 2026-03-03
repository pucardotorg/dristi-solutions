package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.Task;
import org.pucar.dristi.web.models.TaskCriteria;
import org.pucar.dristi.web.models.task.TaskCase;
import org.pucar.dristi.web.models.task.TaskCaseResponse;
import org.pucar.dristi.web.models.task.TaskCaseSearchCriteria;
import org.pucar.dristi.web.models.task.TaskListResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class TaskUtil {

    private final RestTemplate restTemplate;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final Configuration config;

    public TaskUtil(RestTemplate restTemplate, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, Configuration config) {
        this.restTemplate = restTemplate;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    public List<Task> searchTask(TaskCriteria criteria, RequestInfo requestInfo) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskSearchHost()).append("/task/v1/search");
        
        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo);
        request.put("criteria", criteria);

        try {
            Object response = serviceRequestRepository.fetchResult(uri, request);
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskListResponse.class).getList();
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException();
        }
    }

    public List<TaskCase> searchTaskTable(TaskCaseSearchCriteria criteria, RequestInfo requestInfo) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskSearchHost()).append("/task/v1/table/search");
        
        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo);
        request.put("criteria", criteria);
        
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("sortBy", "createdDate");
        pagination.put("order", "asc");
        pagination.put("limit", 100);
        request.put("pagination", pagination);

        try {
            Object response = serviceRequestRepository.fetchResult(uri, request);
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskCaseResponse.class).getList();
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException();
        }
    }
}

