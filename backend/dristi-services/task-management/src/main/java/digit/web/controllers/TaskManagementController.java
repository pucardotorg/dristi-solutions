package digit.web.controllers;

import digit.service.TaskCreationService;
import digit.service.TaskManagementService;
import digit.util.ResponseInfoFactory;
import digit.util.TaskUtil;
import digit.web.models.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("")
@Slf4j
public class TaskManagementController {

    private final TaskManagementService taskManagementService;
    private final ResponseInfoFactory responseInfoFactory;
    private final TaskCreationService taskCreationService;


    @Autowired
    public TaskManagementController(TaskManagementService taskManagementService, ResponseInfoFactory responseInfoFactory, TaskCreationService taskCreationService) {
        this.taskManagementService = taskManagementService;
        this.responseInfoFactory = responseInfoFactory;
        this.taskCreationService = taskCreationService;
    }

    @RequestMapping(value = "/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<TaskManagementResponse> createTaskManagement(@Parameter(in = ParameterIn.DEFAULT, description = "API to create a new task management record in the system. A task management record can contain\n" +
            "        one or more tasks related to a case or order, along with workflow and assignment information.", required = true, schema = @Schema()) @Valid @RequestBody TaskManagementRequest request) {
        log.info("Creating task management : {} ", request.getTaskManagement());
        TaskManagement taskManagement = taskManagementService.createTaskManagement(request);
        TaskManagementResponse response = TaskManagementResponse.builder()
                .taskManagement(taskManagement).responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true)).build();
        log.info("Created task management : {} ", response.getTaskManagement());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


    @RequestMapping(value = "/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<TaskManagementResponse> updateTaskManagement(@Parameter(in = ParameterIn.DEFAULT, description = "API to update an existing task management record. Can be used to update task details, status, workflow state,\n" +
            "        or any other task management related information for one or more tasks within the record.", required = true, schema = @Schema()) @Valid @RequestBody TaskManagementRequest request) {
        log.info("updating task management : {} ", request.getTaskManagement());
        TaskManagement taskManagement = taskManagementService.updateTaskManagement(request);
        TaskManagementResponse response = TaskManagementResponse.builder()
                .taskManagement(taskManagement).responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true)).build();
        log.info("updated task management : {} ", response.getTaskManagement());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<TaskManagementSearchResponse> getTaskManagement(@Parameter(in = ParameterIn.DEFAULT, description = "API to search for task management records based on various criteria including case/order references,\n" +
            "workflow status, task types, and other task management specific filters.", required = true, schema = @Schema()) @Valid @RequestBody TaskSearchRequest request) {

        log.info("searching task management : {} ", request);

        List<TaskManagement> taskManagementRecords = taskManagementService.getTaskManagement(request);
        int totalCount;
        if (request.getPagination() != null) {
            totalCount = request.getPagination().getTotalCount().intValue();
        } else {
            totalCount = taskManagementRecords.size();
        }

        TaskManagementSearchResponse response = TaskManagementSearchResponse.builder().responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .taskManagementRecords(taskManagementRecords)
                .totalCount(totalCount)
                .pagination(request.getPagination())
                .build();

        log.info("searched task management : {} ", response.getTaskManagementRecords());

        return ResponseEntity.accepted().body(response);
    }

    @PostMapping("/v1/generate") //dummy endpoint
    public void generateFollowUpTasks(@RequestBody TaskManagementRequest request) {
        try {
            taskCreationService.generateFollowUpTasks(request.getRequestInfo(), request.getTaskManagement());
        } catch (Exception e) {
            log.error("Error generating follow-up tasks: {}", e.getMessage(), e);
        }
    }
}
