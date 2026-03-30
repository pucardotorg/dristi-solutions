package pucar.strategy;

import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

public interface OrderUpdateStrategy {

    boolean supportsPreProcessing(OrderRequest orderRequest);

    boolean supportsPostProcessing(OrderRequest orderRequest);


    OrderRequest preProcess(OrderRequest orderRequest);

    OrderRequest postProcess(OrderRequest orderRequest);

    boolean supportsCommon(OrderRequest request);

    CaseDiaryEntry execute(OrderRequest request);

}
