package pucar.service;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.util.OrderUtil;
import pucar.web.models.BulkUpdateRequest;
import pucar.web.models.Order;

import java.util.List;

@Service
@Slf4j
public class OrderService {

    private final OrderUtil orderUtil;

    @Autowired
    public OrderService(OrderUtil orderUtil) {
        this.orderUtil = orderUtil;
    }

    public List<Order> updateBulkOrder(@Valid BulkUpdateRequest request) {


        // preprocess --- before updating the order

        // postprocess --- after updating the order

        // if some preprocess is there then process preprocess

        // if some postprocess is there then process postprocess

        // update order using update order api

        return null;

    }
}
