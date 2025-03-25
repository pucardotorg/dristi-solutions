package pucar.strategy;

import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

public class CheckoutAcceptance implements OrderUpdateStrategy {
    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
    }



        //  no case
/// /no application

        ///  before publish
        // no

        ///  after publish
        // update hearing (hearing number form current order)

        // start time = order .addtional details .formdata.newhearingdate ,end time =order .addtional details .formdata.newhearingdate action = bulk_reschedule

}
