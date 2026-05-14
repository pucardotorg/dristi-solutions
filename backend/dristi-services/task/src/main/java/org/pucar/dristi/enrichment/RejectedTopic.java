package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.TaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import static org.pucar.dristi.config.ServiceConstants.REJECTED;

@Component
@Slf4j
public class RejectedTopic implements TopicStrategy{

    private final Configuration configuration;

    private final Producer producer;

    @Autowired
    public RejectedTopic(Configuration configuration, Producer producer) {
        this.configuration = configuration;
        this.producer = producer;
    }

    @Override
    public boolean canPush(String status) {
        return status.equalsIgnoreCase(REJECTED);
    }

    @Override
    public void pushToTopic(TaskRequest taskRequest) {
        String topicName = configuration.getTaskJoinCaseRejectedTopic();
        log.info("pushing into topic {} ", topicName);
        producer.push(topicName,taskRequest);
    }
}
