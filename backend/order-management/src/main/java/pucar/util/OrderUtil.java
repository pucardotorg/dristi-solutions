package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.OrderExistsRequest;
import pucar.web.models.OrderExistsResponse;
import pucar.web.models.OrderRequest;
import pucar.web.models.OrderResponse;

import java.util.HashMap;
import java.util.Map;

import static pucar.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_ORDER;

@Component
@Slf4j
public class OrderUtil {

    private final Configuration configuration;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public OrderUtil(RestTemplate restTemplate, ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository) {
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public Boolean fetchOrderDetails(OrderExistsRequest orderExistsRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderExistsPath());

        Object response = new HashMap<>();
        OrderExistsResponse orderExistsResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri,orderExistsRequest);
            orderExistsResponse = objectMapper.convertValue(response, OrderExistsResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderExistsResponse.getOrder().get(0).getExists();
    }

    public OrderResponse updateOrder(OrderRequest orderRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderUpdatePath());
        Object response;
        OrderResponse orderResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri,orderRequest);
            orderResponse = objectMapper.convertValue(response, OrderResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderResponse;
    }

}
