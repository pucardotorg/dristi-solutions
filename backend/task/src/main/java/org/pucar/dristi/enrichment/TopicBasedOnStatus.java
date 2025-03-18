package org.pucar.dristi.enrichment;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TopicBasedOnStatus {

    private final List<TopicStrategy> topicStrategies;

    public TopicBasedOnStatus(List<TopicStrategy> topicStrategies) {
        this.topicStrategies = topicStrategies;
    }


    public void pushToTopicBasedOnStatus(String status, Object joinCaseBody) {
        topicStrategies.stream()
                .filter(topicStrategy -> topicStrategy.canPush(status))
                .forEach(topicStrategy -> topicStrategy.pushToTopic(joinCaseBody));
    }

}
