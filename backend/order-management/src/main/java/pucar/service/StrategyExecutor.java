package pucar.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pucar.strategy.OrderUpdateStrategy;
import pucar.web.models.OrderRequest;

import java.util.List;

@RequiredArgsConstructor
@Service
public class StrategyExecutor {

    private final List<OrderUpdateStrategy> enrichmentStrategies;

    public void beforePublish(OrderRequest orderRequest) {
        enrichmentStrategies.stream()
                .filter(strategy -> strategy.supportsPreProcessing(orderRequest))
                .forEach(strategy -> strategy.preProcess(orderRequest));

        // we can collect here all the order request and send it for botd
    }
}
