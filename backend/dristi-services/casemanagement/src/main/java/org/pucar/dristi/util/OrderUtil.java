package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.OrderPagination;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.order.Order;
import org.pucar.dristi.web.models.order.OrderCriteria;
import org.pucar.dristi.web.models.order.OrderListResponse;
import org.pucar.dristi.web.models.order.OrderSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_ORDER;


@Component
@Slf4j
public class OrderUtil {

    private final Configuration configuration;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public OrderUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository) {
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public List<Order> getOrders(String filingNumber, String courtId) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderSearchHost()).append(configuration.getOrderSearchPath());
        Object response;
        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .criteria(OrderCriteria.builder().filingNumber(filingNumber).status("PUBLISHED").courtId(courtId).build())
                .pagination(Pagination.builder().sortBy("createdDate").order(OrderPagination.ASC).limit(100).build())
                .build();
        OrderListResponse orderListResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, orderSearchRequest);
            orderListResponse = objectMapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderListResponse.getList();
    }
}
