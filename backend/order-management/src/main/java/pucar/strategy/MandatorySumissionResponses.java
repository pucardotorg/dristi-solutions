package pucar.strategy;

import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

public class MandatorySumissionResponses implements OrderUpdateStrategy {
    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    // before publish order

        // no

        // after publish order

        // create submission pending task

}
