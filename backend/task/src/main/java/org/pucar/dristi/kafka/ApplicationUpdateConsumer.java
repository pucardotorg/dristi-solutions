package org.pucar.dristi.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.service.TaskService;
import org.pucar.dristi.web.models.TaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class ApplicationUpdateConsumer {

    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    @Autowired
    public ApplicationUpdateConsumer(TaskService taskService, ObjectMapper objectMapper) {
        this.taskService = taskService;
        this.objectMapper = objectMapper;
    }


    @KafkaListener(topics = {"${application.kafka.update.topic}"})
    public void updateTaskStatus(final Map<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.info("Received record for topic {} , method: taskUpdate , result: InProgress", topic);
        try {
            String application = objectMapper.writeValueAsString(record);
            LinkedHashMap<String, Object> taskRequestMap = JsonPath.read(application, APPLICATION_DETAILS_PATH);
            TaskRequest taskRequest = objectMapper.convertValue(taskRequestMap, TaskRequest.class);
            String applicationType = JsonPath.read(application, APPLICATION_TYPE_PATH);
            String status = JsonPath.read(application, APPLICATION_STATUS_PATH);
            //TO-Do update application type and status
            if(applicationType.equalsIgnoreCase("POAAPPROVAL") && status != null && status.equalsIgnoreCase(APPROVED)) {
                taskService.updateTask(taskRequest);
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


}
