package org.egov.eTreasury.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.demand.DemandRequest;
import org.egov.eTreasury.model.demand.DemandResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class DemandUtil {

    private final PaymentConfiguration configuration;

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    public DemandUtil(PaymentConfiguration configuration, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }


    public DemandResponse createDemand(DemandRequest demandRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDemandHost()).append(configuration.getDemandCreateEndPoint());

        log.info("Creating demand with uri: {}", uri);

        Object response = null;
        try {
            response = restTemplate.postForObject(uri.toString(), demandRequest, Object.class);
            DemandResponse demandResponse = objectMapper.convertValue(response, DemandResponse.class);
            return demandResponse;
        } catch (Exception e) {
            log.error("ERROR_WHILE_CREATING_DEMAND", e);
            throw new RuntimeException("ERROR_WHILE_CREATING_DEMAND", e);
        }
    }
}
