package org.pucar.dristi.web.controllers;

import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.TaskService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.*;

import jakarta.validation.Valid;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:50.003326400+05:30[Asia/Calcutta]")
@Controller
@RequestMapping("")
public class TaskApiController {

    private TaskService taskService;

    private ResponseInfoFactory responseInfoFactory;

    @Autowired
    public TaskApiController(TaskService taskService, ResponseInfoFactory responseInfoFactory) {
        this.taskService = taskService;
        this.responseInfoFactory = responseInfoFactory;
    }

    public void setMockInjects(TaskService taskService, ResponseInfoFactory responseInfoFactory){
        this.taskService = taskService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/v1/create", method = RequestMethod.POST)
    public ResponseEntity<TaskResponse> taskV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "details for the creation of task", schema = @Schema()) @Valid @RequestBody TaskRequest body) {
        Task task = taskService.createTask(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        TaskResponse taskResponse = TaskResponse.builder().task(task).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/exists", method = RequestMethod.POST)
    public ResponseEntity<TaskExistsResponse> taskV1ExistsPost(@Parameter(in = ParameterIn.DEFAULT, description = "check if the task(S) exists", required = true, schema = @Schema()) @Valid @RequestBody TaskExistsRequest body) {
        TaskExists taskExists = taskService.existTask(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        TaskExistsResponse taskExistsResponse = TaskExistsResponse.builder().task(taskExists).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskExistsResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/search", method = RequestMethod.POST)
    public ResponseEntity<TaskListResponse> taskV1SearchPost( @Parameter(in = ParameterIn.DEFAULT, schema = @Schema()) @Valid @RequestBody TaskSearchRequest request){
        List<Task> tasks = taskService.searchTask(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        int totalCount;
        if (request.getPagination() != null) {
            totalCount = request.getPagination().getTotalCount().intValue();
        } else {
            totalCount = tasks.size();
        }
        TaskListResponse taskListResponse = TaskListResponse.builder().list(tasks).totalCount(totalCount).pagination(request.getPagination()).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskListResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/update", method = RequestMethod.POST)
    public ResponseEntity<TaskResponse> taskV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "details for the update of task", schema = @Schema()) @Valid @RequestBody TaskRequest body) {
        Task task = taskService.updateTask(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        TaskResponse taskResponse = TaskResponse.builder().task(task).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/uploadDocument", method = RequestMethod.POST)
    public ResponseEntity<TaskResponse> taskV1UploadDocument(@Parameter(in = ParameterIn.DEFAULT, description = "details for the update of task", schema = @Schema()) @Valid @RequestBody TaskRequest body) {
        Task task = taskService.uploadDocument(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        TaskResponse taskResponse = TaskResponse.builder().task(task).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/table/search", method = RequestMethod.POST)
    public ResponseEntity<TaskCaseResponse> taskV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, schema = @Schema()) @Valid @RequestBody TaskCaseSearchRequest request) {
        List<TaskCase> tasks = taskService.searchCaseTask(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        int totalCount;
        if (request.getPagination() != null) {
            totalCount = request.getPagination().getTotalCount().intValue();
        } else {
            totalCount = tasks.size();
        }
        TaskCaseResponse taskCaseResponse = TaskCaseResponse.builder().list(tasks).totalCount(totalCount).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskCaseResponse, HttpStatus.OK);
    }

    @PostMapping("/v1/_getTasksToSign")
    public ResponseEntity<TasksToSignResponse> getTasksToSign(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody TasksToSignRequest request){
        List<TaskToSign> taskToSign = taskService.createTasksToSignRequest(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

        TasksToSignResponse response = TasksToSignResponse.builder()
                .responseInfo(responseInfo)
                .taskList(taskToSign)
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


    @PostMapping("/v1/_updateSignedTasks")
    public ResponseEntity<UpdateSignedTaskResponse> updateSignedTasks(@Parameter(in = ParameterIn.DEFAULT, required = true, schema = @Schema()) @Valid @RequestBody UpdateSignedTaskRequest request) {
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        List<Task> tasks = taskService.updateTaskWithSignedDoc(request);
        UpdateSignedTaskResponse response = UpdateSignedTaskResponse.builder()
                .responseInfo(responseInfo)
                .tasks(tasks)
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/bulk-send", method = RequestMethod.POST)
    public ResponseEntity<BulkSendResponse> taskBulkSendPost(@Parameter(in = ParameterIn.DEFAULT, description = "details for the bulk sending of task", schema = @Schema()) @Valid @RequestBody BulkSendRequest body) {
        List<BulkSend> bulkSendTasks = taskService.bulkSend(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BulkSendResponse taskResponse = BulkSendResponse.builder().bulkSendTasks(bulkSendTasks).responseInfo(responseInfo).build();
        return new ResponseEntity<>(taskResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/task-details", method = RequestMethod.POST)
    public ResponseEntity<TaskDetailsResponse> taskDetailsPost(@Parameter(in = ParameterIn.DEFAULT, description = "Request containing task details, task number and unique ID", schema = @Schema()) @Valid @RequestBody TaskDetailsRequest body) {
        TaskDetailsDTO result = taskService.processTaskDetails(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        TaskDetailsResponse response = TaskDetailsResponse.builder()
                .taskDetailsDTO(result)
                .responseInfo(responseInfo)
                .message("Task details processed successfully")
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/bulk-pending-collection-update", method = RequestMethod.POST)
    public ResponseEntity<BulkPendingCollectionUpdateResponse> bulkPendingCollectionUpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Bulk update isPendingCollection to false", schema = @Schema()) @Valid @RequestBody BulkPendingCollectionUpdateRequest body) {
        List<BulkPendingCollectionUpdate> tasks = taskService.bulkUpdatePendingCollection(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BulkPendingCollectionUpdateResponse response = BulkPendingCollectionUpdateResponse.builder()
                .tasks(tasks)
                .responseInfo(responseInfo)
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
