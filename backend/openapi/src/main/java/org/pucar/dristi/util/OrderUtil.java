package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.OrderListResponse;
import org.pucar.dristi.web.models.OrderSearchRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OrderUtil {

    private final ServiceRequestRepository serviceRequestRepository;
    private final Configuration configuration;
    private final ObjectMapper objectMapper;

    public OrderUtil(ServiceRequestRepository serviceRequestRepository, Configuration configuration, ObjectMapper objectMapper) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
    }

    public OrderListResponse getOrders(OrderSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderSearchPath());
        try {
            log.info("Calling order service with URI: {}", uri);
            Object response = serviceRequestRepository.fetchResult(uri, searchRequest);
            return objectMapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error("Error", e);
            return null;
        }
    }
}
