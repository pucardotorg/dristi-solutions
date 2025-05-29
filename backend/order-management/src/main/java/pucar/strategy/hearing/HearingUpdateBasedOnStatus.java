package pucar.strategy.hearing;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.strategy.HearingUpdateStrategy;
import pucar.web.models.OrderRequest;
import pucar.web.models.hearing.Hearing;

import java.util.List;

@Component
public class HearingUpdateBasedOnStatus {

    private final List<HearingUpdateStrategy> strategies;

    public HearingUpdateBasedOnStatus(List<HearingUpdateStrategy> strategies) {
        this.strategies = strategies;
    }

    public void updateHearingBasedOnStatus(Hearing hearing, OrderRequest orderRequest, boolean isCreateOrderCall) {

        String status = hearing.getStatus();

        strategies.stream().filter(hearingUpdateStrategy -> hearingUpdateStrategy.updateHearingBasedOnStatus(status, isCreateOrderCall))
                .forEach(hearingUpdateStrategy -> hearingUpdateStrategy.updateHearingBasedOnStatus(hearing, orderRequest));

    }

}
