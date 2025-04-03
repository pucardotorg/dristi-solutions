package org.egov.eTreasury.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.DemandRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class DemandUtil {

    private final PaymentConfiguration configuration;

    private final RestTemplate restTemplate;

    public DemandUtil(PaymentConfiguration configuration, RestTemplate restTemplate) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
    }


    public void createDemand(DemandRequest demandRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDemandHost()).append(configuration.getDemandCreateEndPoint());

        log.info("Creating demand with uri: {}", uri);

        Object response = null;
        try {
            response = restTemplate.postForObject(uri.toString(), demandRequest, Object.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_CREATING_DEMAND", e);
            throw new RuntimeException("ERROR_WHILE_CREATING_DEMAND", e);
        }
    }
}
