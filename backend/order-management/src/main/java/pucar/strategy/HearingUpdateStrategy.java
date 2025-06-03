package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.OrderRequest;
import pucar.web.models.hearing.Hearing;

public interface HearingUpdateStrategy {

    boolean updateHearingBasedOnStatus(String status, boolean isSaveDraftAction);

    void updateHearingBasedOnStatus(Hearing hearing, OrderRequest orderRequest);
}
