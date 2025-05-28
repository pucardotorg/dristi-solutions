package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.OrderRequest;
import pucar.web.models.hearing.Hearing;

public interface HearingUpdateStrategy {

    boolean updateHearingWithOutWorkflow(String status);

    void updateHearingBasedOnStatus(Hearing hearing, OrderRequest orderRequest);
}
