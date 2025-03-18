package org.pucar.dristi.enrichment;

public interface TopicStrategy {

    boolean canPush(String status);
    void pushToTopic(Object joinCaseBody);

}

