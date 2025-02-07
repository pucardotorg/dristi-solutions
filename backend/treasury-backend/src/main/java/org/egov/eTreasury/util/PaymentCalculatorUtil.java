package org.egov.eTreasury.util;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.repository.ServiceRequestRepository;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class PaymentCalculatorUtil {

    private final PaymentConfiguration config;

    private final ServiceRequestRepository repository;
    public PaymentCalculatorUtil(PaymentConfiguration config, ServiceRequestRepository repository) {
        this.config = config;
        this.repository = repository;
    }

    public JsonNode getBreakDown(RequestInfo requestInfo, Double chequeAmount, String filingNumber, Boolean isDelayCondonation) {
        log.info("operation = getBreakDown, result = IN_PROGRESS");

        StringBuilder uri = new StringBuilder();
        uri.append(config.getPaymentCalculatorHost()).append(config.getPaymentCalculatorEndpoint());
        Map<String, Object> requestBody = new HashMap<>();

        Map<String, Object> calculationCriteria = new HashMap<>();
        calculationCriteria.put("checkAmount", chequeAmount);
        calculationCriteria.put("numberOfApplication", 1);
        calculationCriteria.put("isDelayCondonation", isDelayCondonation);
        calculationCriteria.put("filingNumber", filingNumber);

        requestBody.put("RequestInfo", requestInfo);
        requestBody.put("EFillingCalculationCriteria", new Object[]{calculationCriteria});

        JsonNode breakDown = null;
        try {
            JsonNode response = (JsonNode) repository.fetchResult(uri, requestBody);
            breakDown = response.get("Calculation").get(0).get("breakDown");
        } catch (Exception e){
            log.error("operation = getBreakDown, result = FAILURE");
            throw new CustomException("DK_RR_JSON_PROCESSING_ERR", "Invalid Json response");
        }
        log.info("operation = getBreakDown, result = SUCCESS");
        return breakDown;
    }
}
