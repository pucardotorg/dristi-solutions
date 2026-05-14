package pucar.factory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.service.CompositeOrderService;
import pucar.service.OrderProcessor;

@Component
public class CompositeOrderFactory implements OrderFactory{

    private final CompositeOrderService compositeOrderService;

    @Autowired
    public CompositeOrderFactory(CompositeOrderService compositeOrderService) {
        this.compositeOrderService = compositeOrderService;
    }

    @Override
    public OrderProcessor createProcessor() {
        return compositeOrderService;
    }
}
