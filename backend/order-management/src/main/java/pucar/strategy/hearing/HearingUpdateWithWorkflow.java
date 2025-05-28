package pucar.strategy.hearing;

import org.springframework.beans.factory.annotation.Autowired;
import pucar.config.Configuration;
import pucar.strategy.HearingUpdateStrategy;
import pucar.util.HearingUtil;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingRequest;

import static pucar.config.ServiceConstants.CLOSE;
import static pucar.config.ServiceConstants.IN_PROGRESS;

public class HearingUpdateWithWorkflow implements HearingUpdateStrategy {

    private final HearingUtil hearingUtil;

    private final Configuration configuration;

    @Autowired
    public HearingUpdateWithWorkflow(HearingUtil hearingUtil, Configuration configuration) {
        this.hearingUtil = hearingUtil;
        this.configuration = configuration;
    }

    @Override
    public boolean updateHearingWithOutWorkflow(String status) {
        return IN_PROGRESS.equalsIgnoreCase(status);
    }

    @Override
    public void updateHearingBasedOnStatus(Hearing hearing, OrderRequest orderRequest) {

        //TODO need to check

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction(CLOSE);
        hearing.setWorkflow(workflowObject);

        StringBuilder updateUri = new StringBuilder();
        updateUri.append(configuration.getHearingHost()).append(configuration.getHearingUpdateEndPoint());

        hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(orderRequest.getRequestInfo()).build(), updateUri);

    }
}
