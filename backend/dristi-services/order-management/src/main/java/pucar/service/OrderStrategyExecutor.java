package pucar.service;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.stereotype.Service;
import pucar.strategy.OrderUpdateStrategy;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Service
public class OrderStrategyExecutor {

    private final List<OrderUpdateStrategy> enrichmentStrategies;

    public void beforePublish(OrderRequest orderRequest) {
        enrichmentStrategies.stream()
                .filter(strategy -> strategy.supportsPreProcessing(orderRequest))
                .forEach(strategy -> strategy.preProcess(orderRequest));

        // we can collect here all the order request and send it for botd
    }

    public void afterPublish(OrderRequest orderRequest) {
        enrichmentStrategies.stream()
                .filter(strategy -> strategy.supportsPostProcessing(orderRequest))
                .forEach(strategy -> strategy.postProcess(orderRequest));

    }

    public List<CaseDiaryEntry> commonProcess(OrderRequest orderRequest) {

        List<CaseDiaryEntry> diaryEntries = new ArrayList<>();
        enrichmentStrategies.stream()
                .filter(strategy -> strategy.supportsCommon(orderRequest))
                .forEach((strategy) -> {
                    CaseDiaryEntry diaryEntry = strategy.execute(orderRequest);
                    if (!ObjectUtils.isEmpty(diaryEntry)) diaryEntries.add(diaryEntry);

                });

        return diaryEntries;

    }
}
