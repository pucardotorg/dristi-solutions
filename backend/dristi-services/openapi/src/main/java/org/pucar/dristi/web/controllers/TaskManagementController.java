package org.pucar.dristi.web.controllers;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.TaskManagementService;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.task_management.TaskManagementRequest;
import org.pucar.dristi.web.models.task_management.TaskManagementResponse;
import org.pucar.dristi.web.models.task_management.TaskManagementSearchResponse;
import org.pucar.dristi.web.models.task_management.TaskSearchRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/openapi/task-management")
@Slf4j
public class TaskManagementController {

    private final TaskManagementService taskManagementService;
    private final ResponseInfoFactory responseInfoFactory;
    private final RequestInfoGenerator requestInfoGenerator;

    public TaskManagementController(TaskManagementService taskManagementService, ResponseInfoFactory responseInfoFactory, RequestInfoGenerator requestInfoGenerator) {
        this.taskManagementService = taskManagementService;
        this.responseInfoFactory = responseInfoFactory;
        this.requestInfoGenerator = requestInfoGenerator;
    }

    @PostMapping("/v1/_create")
    public ResponseEntity<TaskManagementResponse> createTaskManagement(@RequestBody TaskManagementRequest request) {

        log.info("api=/v1/_create, status=IN_PROGRESS, request={}", request);

        // This api is accessed before login so internal request info is set
        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        TaskManagementResponse response = taskManagementService.createTaskManagement(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_create, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_update")
    public ResponseEntity<TaskManagementResponse> updateTaskManagement(@RequestBody TaskManagementRequest request) {

        log.info("api=/v1/_update, status=IN_PROGRESS, request={}", request);

        // This api is accessed before login so internal request info is set
        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        TaskManagementResponse response = taskManagementService.updateTaskManagement(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_update, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_search")
    public ResponseEntity<TaskManagementSearchResponse> searchTaskManagement(@RequestBody TaskSearchRequest request) {

        log.info("api=/v1/_search, status=IN_PROGRESS, request={}", request);

        // This api is accessed before login so internal request info is set
        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        TaskManagementSearchResponse response = taskManagementService.searchTaskManagement(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_search, status=SUCCESS");

        return ResponseEntity.ok(response);
    }
}
