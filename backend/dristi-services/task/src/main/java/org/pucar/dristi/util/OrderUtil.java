package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.OrderExists;
import org.pucar.dristi.web.models.OrderExistsRequest;
import org.pucar.dristi.web.models.OrderExistsResponse;
import org.pucar.dristi.web.models.order.Order;
import org.pucar.dristi.web.models.order.OrderCriteria;
import org.pucar.dristi.web.models.order.OrderListResponse;
import org.pucar.dristi.web.models.order.OrderSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.PUBLISHED;
import static org.pucar.dristi.config.ServiceConstants.SCHEDULE_OF_HEARING_DATE;

@Slf4j
@Component
public class OrderUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public OrderUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs,
            ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }

    public Boolean fetchOrderDetails(RequestInfo requestInfo, UUID orderId) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getOrderHost()).append(configs.getOrderPath());

        OrderExistsRequest orderExistsRequest = new OrderExistsRequest();
        orderExistsRequest.setRequestInfo(requestInfo);
        OrderExists orderExists = new OrderExists();
        orderExists.setOrderId(orderId);
        List<OrderExists> criteriaList = new ArrayList<>();
        criteriaList.add(orderExists);
        orderExistsRequest.setOrder(criteriaList);

        Object response = new HashMap<>();
        OrderExistsResponse orderExistsResponse = new OrderExistsResponse();
        try {
            response = restTemplate.postForObject(uri.toString(), orderExistsRequest, Map.class);
            orderExistsResponse = mapper.convertValue(response, OrderExistsResponse.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_ORDER:: {}", e.toString());
        }

        if (orderExistsResponse.getOrder() == null || orderExistsResponse.getOrder().isEmpty())
            return false;

        return orderExistsResponse.getOrder().get(0).getExists();
    }

    public OrderListResponse getOrders(OrderSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getOrderHost()).append(configs.getOrderSearchPath());
        Object response;
        OrderListResponse orderListResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, searchRequest);
            orderListResponse = objectMapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_ORDER", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_ORDER", e.getMessage());

        }
        return orderListResponse;
    }

    public Order getOrderByOrderId(RequestInfo requestInfo, String orderId) {
        OrderCriteria orderCriteria = OrderCriteria.builder()
                .id(orderId)
                .build();
        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(orderCriteria)
                .build();

        OrderListResponse orderListResponse = getOrders(orderSearchRequest);

        if (orderListResponse.getList() == null || orderListResponse.getList().isEmpty()) {
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_ORDER",
                    "Order not found for order id: " + orderId);
        }
        return orderListResponse.getList().get(0);

    }

    public String getOrderIdByHearingId(RequestInfo requestInfo, String hearingId, String tenantId) {
        OrderCriteria orderCriteria = OrderCriteria.builder()
                .scheduledHearingNumber(hearingId)
                .tenantId(tenantId)
                .status(PUBLISHED)
                .build();
        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(orderCriteria)
                .build();

        int maxRetries = configs.getOrderFetchRetryCount();
        long retryIntervalMs = configs.getOrderFetchRetryIntervalMs();

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            OrderListResponse orderListResponse = getOrders(orderSearchRequest);
            if (orderListResponse != null && orderListResponse.getList() != null
                    && !orderListResponse.getList().isEmpty()
                    && orderListResponse.getList().get(0).getId() != null) {
                return orderListResponse.getList().get(0).getId().toString();
            }
            if (attempt < maxRetries) {
                log.warn("No PUBLISHED order found for scheduledHearingNumber: {} (attempt {}/{}), retrying in {}ms...",
                        hearingId, attempt, maxRetries, retryIntervalMs);
                try {
                    Thread.sleep(retryIntervalMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("Retry interrupted for hearingId: {}", hearingId);
                    break;
                }
            }
        }
        log.warn("No PUBLISHED order found for scheduledHearingNumber: {} after {} attempts", hearingId, maxRetries);
        return null;
    }
}
