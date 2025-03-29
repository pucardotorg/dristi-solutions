package org.pucar.dristi.enrichment;

import org.pucar.dristi.web.models.TaskRequest;

public interface TopicStrategy {

    boolean canPush(String status);
    void pushToTopic(TaskRequest taskRequest);

}

