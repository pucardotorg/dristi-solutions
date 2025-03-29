package org.pucar.dristi.kafka.consumer;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.service.PendingTaskService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class PendingTaskUpdateConsumer {

    private final PendingTaskService pendingTaskService;
    private final ObjectMapper objectMapper;

    public PendingTaskUpdateConsumer(PendingTaskService pendingTaskService, ObjectMapper objectMapper) {
        this.pendingTaskService = pendingTaskService;
        this.objectMapper = objectMapper;
    }


    @KafkaListener(topics = "#{'${kafka.topics.join.case}'.split(',')}")
    public void listener(ConsumerRecord<String, Map<String, Object>> consumerRecord) {
        try {
            Map<String, Object> jsonMap = consumerRecord.value();
            pendingTaskService.updatePendingTask(consumerRecord.topic(), jsonMap);
        } catch (Exception e){
            log.error("Error in updating PendingTask for join case.", e);
        }
    }

}
