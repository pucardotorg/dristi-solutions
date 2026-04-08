package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.VcEntityCriteria;
import digit.web.models.VcEntityOrderSearchRequest;
import digit.web.models.VcOrderSearchPagination;
import digit.web.models.orders.OrderListResponse;
import digit.web.models.orders.OrderSearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class OrderUtil {

    private final RestTemplate restTemplate;


    private final Configuration configuration;

    private final ObjectMapper objectMapper;

    private final ServiceRequestRepository serviceRequestRepository;

    public OrderUtil(RestTemplate restTemplate, Configuration configuration, ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository) {
        this.restTemplate = restTemplate;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public String fetchSignedFileStore(String referenceId, String tenantId, RequestInfo requestInfo)  {
        StringBuilder orderSearchUrl = new StringBuilder();
        orderSearchUrl.append(configuration.getOrderSearchHost()).append(configuration.getOrderSearchPath());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json, text/plain, */*");
        headers.set("Accept-Language", "en-GB,en-US;q=0.9,en;q=0.8");
        headers.set("Connection", "keep-alive");
        headers.set("Content-Type", "application/json;charset=UTF-8");

        requestInfo.setAuthToken(requestInfo.getAuthToken());

        VcOrderSearchPagination vcOrderSearchPagination = VcOrderSearchPagination.builder()
                .limit(1.0)
                .offSet(0.0)
                .build();

        VcEntityCriteria criteria = VcEntityCriteria.builder()
                .id(referenceId)
                .build();

        VcEntityOrderSearchRequest vcEntityOrderSearchRequest = VcEntityOrderSearchRequest.builder()
                .requestInfo(requestInfo)
                .tenantId(tenantId)
                .criteria(criteria)
                .pagination(vcOrderSearchPagination)
                .build();

        HttpEntity<VcEntityOrderSearchRequest> entity = new HttpEntity<>(vcEntityOrderSearchRequest, headers);

        ResponseEntity<Object> response;
        try {
            response = restTemplate.exchange(orderSearchUrl.toString(), HttpMethod.POST, entity, Object.class);
            if (response.getBody() == null) {
                throw new CustomException("ORDER_SEARCH_ERR", "Response body is null");
            }
        } catch (Exception e) {
            throw new CustomException("ORDER_SEARCH_ERR", "Error while fetching the order details: " + e.getMessage());
        }
        String filestoreId = null;
        try {
            String responseBodyString = objectMapper.writeValueAsString(response.getBody());
            log.info("Response from the order search: " + responseBodyString);
            filestoreId = JsonPath.parse(responseBodyString).read("$.list[0].documents[0].fileStore", String.class);
        } catch (Exception e) {
            throw new CustomException("JSON_PARSING_ERROR", "Error while extracting cnr number from the order response");
        }

        return filestoreId;
    }

    public OrderListResponse getOrders(OrderSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderSearchHost()).append(configuration.getOrderSearchPath());
        try {
            log.info("Calling order service with URI: {}", uri);
            Object response = serviceRequestRepository.fetchResult(uri, searchRequest);
            return objectMapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_ORDER", e);
            return null;
        }
    }
}
