package pucar.strategy.hearing;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.strategy.HearingUpdateStrategy;
import pucar.web.models.OrderRequest;
import pucar.web.models.hearing.Hearing;

import static pucar.config.ServiceConstants.ABATED;
import static pucar.config.ServiceConstants.COMPLETED;

@Component
@Slf4j
public class HearingUpdateWithOutWorkFlow implements HearingUpdateStrategy {
    @Override
    public boolean updateHearingWithOutWorkflow(String status) {
        return (ABATED.equalsIgnoreCase(status) || COMPLETED.equalsIgnoreCase(status));
    }

    @Override
    public void updateHearingBasedOnStatus(Hearing hearing, OrderRequest orderRequest) {

        //TODO need to check how to implement this

    }
}
