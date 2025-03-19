package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.TaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import static org.pucar.dristi.config.ServiceConstants.APPROVED;

@Component
@Slf4j
public class ApprovedTopic implements TopicStrategy{

    private final Configuration configuration;

    private final Producer producer;

    @Autowired
    public ApprovedTopic(Configuration configuration, Producer producer) {
        this.configuration = configuration;
        this.producer = producer;
    }

    @Override
    public boolean canPush(String status) {
        return status.equalsIgnoreCase(APPROVED);
    }

    @Override
    public void pushToTopic(TaskRequest taskRequest) {
        String topicName = configuration.getTaskJoinCaseApprovedTopic();
        log.info("pushing into topic {} ", topicName);
        producer.push(topicName,taskRequest);
    }
}
