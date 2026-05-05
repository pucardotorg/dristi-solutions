package org.pucar.dristi.kafka.consumer;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.service.PendingTaskService;
import org.pucar.dristi.util.CaseOverallStatusUtil;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class PendingTaskUpdateConsumer {

    private final PendingTaskService pendingTaskService;
    private final CaseOverallStatusUtil caseOverallStatusUtil;
    private final ObjectMapper objectMapper;

    public PendingTaskUpdateConsumer(PendingTaskService pendingTaskService, CaseOverallStatusUtil caseOverallStatusUtil, ObjectMapper objectMapper) {
        this.pendingTaskService = pendingTaskService;
        this.caseOverallStatusUtil = caseOverallStatusUtil;
        this.objectMapper = objectMapper;
    }


    @KafkaListener(topics = "#{'${kafka.topics.join.case}'.split(',')}")
    public void listener(ConsumerRecord<String, Map<String, Object>> consumerRecord) {
        try {
            Map<String, Object> jsonMap = consumerRecord.value();
            pendingTaskService.updatePendingTask(consumerRecord.topic(), jsonMap);
            caseOverallStatusUtil.processJoinCaseStageUpdate(jsonMap);
        } catch (Exception e){
            log.error("Error in updating PendingTask for join case.", e);
        }
    }

}
