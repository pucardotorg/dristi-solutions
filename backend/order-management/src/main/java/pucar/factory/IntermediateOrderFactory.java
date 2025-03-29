package pucar.factory;

import org.springframework.stereotype.Component;
import pucar.service.IntermediateOrderService;
import pucar.service.OrderProcessor;

@Component
public class IntermediateOrderFactory implements OrderFactory{

    private final IntermediateOrderService intermediateOrderService;

    public IntermediateOrderFactory(IntermediateOrderService intermediateOrderService) {
        this.intermediateOrderService = intermediateOrderService;
    }

    @Override
    public OrderProcessor createProcessor() {
        return intermediateOrderService;
    }
}
