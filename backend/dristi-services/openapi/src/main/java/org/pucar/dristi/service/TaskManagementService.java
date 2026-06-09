package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.task_management.TaskManagementRequest;
import org.pucar.dristi.web.models.task_management.TaskManagementResponse;
import org.pucar.dristi.web.models.task_management.TaskManagementSearchResponse;
import org.pucar.dristi.web.models.task_management.TaskSearchRequest;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TaskManagementService {

    private final Configuration config;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    public TaskManagementService(Configuration config, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper) {
        this.config = config;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }

    public TaskManagementResponse createTaskManagement(TaskManagementRequest taskManagementRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getTaskManagementHost()).append(config.getTaskManagementCreateEndpoint());
        log.info("method=createTaskManagement, status=IN_PROGRESS, request={}", taskManagementRequest);

        Object response = serviceRequestRepository.fetchResult(uri, taskManagementRequest);
        log.info("method=createTaskManagement, status=SUCCESS");

        return objectMapper.convertValue(response, TaskManagementResponse.class);


    }

    public TaskManagementResponse updateTaskManagement(TaskManagementRequest taskManagementRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getTaskManagementHost()).append(config.getTaskManagementUpdateEndpoint());
        log.info("method=updateTaskManagement, status=IN_PROGRESS, request={}", taskManagementRequest);

        Object response = serviceRequestRepository.fetchResult(uri, taskManagementRequest);
        log.info("method=updateTaskManagement, status=SUCCESS");

        return objectMapper.convertValue(response, TaskManagementResponse.class);
    }

    public TaskManagementSearchResponse searchTaskManagement(TaskSearchRequest taskSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getTaskManagementHost()).append(config.getTaskManagementSearchEndpoint());
        log.info("method=searchTaskManagement, status=IN_PROGRESS, request={}", taskSearchRequest);

        Object response = serviceRequestRepository.fetchResult(uri, taskSearchRequest);
        log.info("method=searchTaskManagement, status=SUCCESS");

        return objectMapper.convertValue(response, TaskManagementSearchResponse.class);
    }
}
