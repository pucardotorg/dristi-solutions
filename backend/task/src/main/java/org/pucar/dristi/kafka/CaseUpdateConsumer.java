package org.pucar.dristi.kafka;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.HashMap;

@Component
@Slf4j
public class CaseUpdateConsumer {

    private final TaskService taskService;

    @Autowired
    public CaseUpdateConsumer(TaskService taskService) {
        this.taskService = taskService;
    }

    @KafkaListener(topics = {"case-update-last-modified-time"})
    public void caseUpdateTopic(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.info("Received profile editing request for existing join cases requests in topic {}", topic);
        try {
            taskService.updateTaskDetailsForExistingJoinCaseTasks(record);
        } catch (Exception e) {
            log.error("error occurred while serializing", e);
        }

    }
}
