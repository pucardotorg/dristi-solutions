package pucar.service;

import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

import java.util.List;

public interface OrderProcessor {

    void preProcessOrder(OrderRequest request);
    void postProcessOrder(OrderRequest request);
    List<CaseDiaryEntry> processCommonItems(OrderRequest request);


}
