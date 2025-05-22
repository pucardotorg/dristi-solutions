package org.egov.eTreasury.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.models.coremodels.RequestInfoWrapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.demand.DemandRequest;
import org.egov.eTreasury.model.demand.DemandResponse;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@Slf4j
public class DemandUtil {

    private final PaymentConfiguration configuration;

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    @Autowired
    public DemandUtil(PaymentConfiguration configuration, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }


    public DemandResponse createDemand(DemandRequest demandRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDemandHost()).append(configuration.getDemandCreateEndPoint());
        log.info("Creating demand for consumer code:: {}", demandRequest.getDemands().get(0).getConsumerCode());
        Object response = null;
        try {
            response = restTemplate.postForObject(uri.toString(), demandRequest, Object.class);
            return objectMapper.convertValue(response, DemandResponse.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_CREATING_DEMAND", e);
            throw new CustomException("ERROR_WHILE_CREATING_DEMAND", e.getMessage());
        }
    }

    public JsonNode searchBill(String billId, RequestInfo requestInfo) {

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(configuration.getDemandHost() + configuration.getBillingSearchEndPoint())
                .queryParam("billId", billId)
                .queryParam("tenantId", configuration.getEgovStateTenantId()); // Add more params as needed

        log.info("Searching bill with id: {}", billId);

        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(requestInfo);
        Object response = null;
        try {
            response = restTemplate.postForEntity(
                    builder.toUriString(),
                    requestInfoWrapper,
                    Object.class
            ).getBody();
            JsonNode billResponse = objectMapper.convertValue(response, JsonNode.class);
            log.info("Bill fetch for id: {}", billId);
            return billResponse.get("Bill").get(0);
        } catch (Exception e) {
            log.error("Error calling bill search API", e);
            throw new CustomException("BILL_SEARCH_API_ERROR", "Error calling bill search API");
        }
    }
}