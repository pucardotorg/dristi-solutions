package pucar.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;
import pucar.strategy.validation.OrderSignValidator;
import pucar.util.OrderUtil;
import pucar.web.models.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Runs all {@link OrderSignValidator} strategies against the orders selected for (bulk) signing.
 * Orders are fetched once here and shared with every validator, so adding a new pre-sign rule only
 * requires a new {@code OrderSignValidator} bean.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderSignValidationService {

    private final OrderUtil orderUtil;
    private final List<OrderSignValidator> validators;

    public void validate(OrdersToSignRequest request) {
        RequestInfo requestInfo = request.getRequestInfo();

        List<Order> orders = new ArrayList<>();
        for (OrdersCriteria criterion : request.getCriteria()) {
            OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(OrderCriteria.builder()
                            .orderNumber(criterion.getOrderNumber())
                            .tenantId(criterion.getTenantId()).build())
                    .build();

            OrderListResponse response = orderUtil.getOrders(searchRequest);
            if (response.getList() == null || response.getList().isEmpty()) {
                continue;
            }
            orders.add(response.getList().get(0));
        }

        validators.forEach(validator -> validator.validate(requestInfo, orders));
    }
}
