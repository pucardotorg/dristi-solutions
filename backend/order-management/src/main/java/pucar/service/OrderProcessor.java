package pucar.service;

import pucar.web.models.OrderRequest;

public interface OrderProcessor {

    void preProcessOrder(OrderRequest request);
    void postProcessOrder(OrderRequest request);
    void processCommonItems(OrderRequest request);


}
