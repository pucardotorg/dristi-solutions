package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;

import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;

@Slf4j
@Repository
public class BankDetailsRepository {

    private final Configuration configuration;
    private final RestTemplate restTemplate;

    public BankDetailsRepository(Configuration configuration, RestTemplate restTemplate) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
    }

    public JsonNode fetchBankDetails(String ifsc){
        String uri = configuration.getRazorpayIfscApi() + ifsc;

        try{
            return restTemplate.getForObject(uri, JsonNode.class);
        } catch (Exception e){
            throw new CustomException(EXTERNAL_SERVICE_EXCEPTION,
                    String.format("Error fetching bank details for IFSC %s: %s", ifsc, e.getMessage()));
        }
    }
}
