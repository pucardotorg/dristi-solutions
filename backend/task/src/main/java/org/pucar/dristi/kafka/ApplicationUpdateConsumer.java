package org.pucar.dristi.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.TaskService;
import org.pucar.dristi.service.UserService;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class ApplicationUpdateConsumer {

    private final TaskService taskService;
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final Configuration configuration;

    @Autowired
    public ApplicationUpdateConsumer(TaskService taskService, ObjectMapper objectMapper, UserService userService, Configuration configuration) {
        this.taskService = taskService;
        this.objectMapper = objectMapper;
        this.userService = userService;
        this.configuration = configuration;
    }


    @KafkaListener(topics = {"${application.kafka.update.topic}"})
    public void updateTaskStatus(final Map<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.info("Received record for topic {} , method: taskUpdate , result: InProgress", topic);
        try {
            String application = objectMapper.writeValueAsString(record);
            String applicationType = JsonPath.read(application, APPLICATION_TYPE_PATH);
            String status = JsonPath.read(application, APPLICATION_STATUS_PATH);
            String filingNumber = JsonPath.read(application, FILING_NUMBER_PATH);

            if(applicationType.equalsIgnoreCase("APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") && "COMPLETED".equalsIgnoreCase(status)) {
                String taskNumber = JsonPath.read(application, APPLICATION_DETAILS_PATH);

                TaskSearchRequest taskSearchRequest = new TaskSearchRequest();
                taskSearchRequest.setCriteria(TaskCriteria.builder().taskNumber(taskNumber).filingNumber(filingNumber).build());
                taskSearchRequest.setRequestInfo(new RequestInfo());
                List<Task> tasks = taskService.searchTask(taskSearchRequest);
                if(!tasks.isEmpty()){
                    Task task = tasks.get(0);
                    WorkflowObject workflow = new WorkflowObject();
                    workflow.setAction("APPROVE");
                    task.setWorkflow(workflow);
                    RequestInfo requestInfo = createInternalRequestInfo();
                    TaskRequest taskRequest = TaskRequest.builder().task(task).requestInfo(requestInfo).build();
                    taskService.updateTask(taskRequest);
                }
                else {
                    log.error("No task found for the given task number:: {}, method: updateTaskStatus , result: Failure",taskNumber);
                }
            }

        } catch (JsonProcessingException e) {
            log.error("Error occurred while processing json, method: updateTaskStatus , result: Failure");
            throw new RuntimeException();
        } catch (Exception e) {
            log.error("Error occurred while updating evidence, method: updateTaskStatus , result: Failure");
            log.error("Error: {}", e.toString());
        }
        log.info("method: updateTaskStatus , result: Success");

    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setType("SYSTEM");
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(configuration.getTenantId());
        return RequestInfo.builder().userInfo(userInfo).build();
    }

}
