package pucar.service;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.web.models.OrderRequest;

@Service
@Slf4j
public class IntermediateOrderService implements OrderProcessor {

    private final OrderStrategyExecutor orderStrategyExecutor;

    @Autowired
    public IntermediateOrderService(OrderStrategyExecutor orderStrategyExecutor) {
        this.orderStrategyExecutor = orderStrategyExecutor;
    }

    @Override
    public void preProcessOrder(OrderRequest orderRequest) {
        orderStrategyExecutor.beforePublish(orderRequest);
    }

    @Override
    public void postProcessOrder(OrderRequest orderRequest) {
        orderStrategyExecutor.afterPublish(orderRequest);

    }

    @Override
    public void processCommonItems(OrderRequest orderRequest) {
        orderStrategyExecutor.commonProcess(orderRequest);

    }
}
