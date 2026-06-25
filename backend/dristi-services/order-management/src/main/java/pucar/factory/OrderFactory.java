package pucar.factory;

import pucar.service.OrderProcessor;

public interface OrderFactory {

    OrderProcessor createProcessor();

}
