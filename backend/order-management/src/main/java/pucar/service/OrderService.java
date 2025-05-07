package pucar.service;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.factory.OrderFactory;
import pucar.factory.OrderServiceFactoryProvider;
import pucar.util.ADiaryUtil;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.OrderResponse;
import pucar.web.models.adiary.BulkDiaryEntryRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

import java.util.List;


@Service
@Slf4j
public class OrderService {

    private final OrderUtil orderUtil;
    private final OrderServiceFactoryProvider factoryProvider;
    private final ADiaryUtil aDiaryUtil;

    @Autowired
    public OrderService(OrderUtil orderUtil, OrderServiceFactoryProvider factoryProvider, ADiaryUtil aDiaryUtil) {
        this.orderUtil = orderUtil;
        this.factoryProvider = factoryProvider;
        this.aDiaryUtil = aDiaryUtil;
    }


    public Order createOrder(@Valid OrderRequest request) {
        log.info("creating order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", request.getOrder().getOrderNumber(), request.getOrder().getOrderType());
        OrderResponse orderResponse = orderUtil.createOrder(request);
        log.info("created order, result= SUCCESS");
        return orderResponse.getOrder();
    }

    public Order updateOrder(@Valid OrderRequest request) {
        Order order = request.getOrder();
        log.info("updating order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

        OrderFactory orderFactory = factoryProvider.getFactory(order.getOrderCategory());
        OrderProcessor orderProcessor = orderFactory.createProcessor();

        orderProcessor.preProcessOrder(request);

        OrderResponse orderResponse = orderUtil.updateOrder(request);

        List<CaseDiaryEntry> diaryEntries = orderProcessor.processCommonItems(request);

        orderProcessor.postProcessOrder(request);

        log.info("creating diary entry, result= IN_PROGRESS,orderNumber:{}, orderType:{}, entryCount:{}", order.getOrderNumber(), order.getOrderType(), diaryEntries.size());

        // create diary entry
        if (!diaryEntries.isEmpty()) {
            aDiaryUtil.createBulkADiaryEntry(BulkDiaryEntryRequest.builder()
                    .requestInfo(request.getRequestInfo())
                    .caseDiaryList(diaryEntries).build());
        }

        log.info("updated order and created diary entry, result= SUCCESS");

        return orderResponse.getOrder();
    }
}
