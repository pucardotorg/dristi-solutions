package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.CalculationRes;
import org.pucar.dristi.web.models.EFillingCalculationCriteria;
import org.pucar.dristi.web.models.EFillingCalculationRequest;
import org.pucar.dristi.web.models.JoinCasePaymentRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class PaymentCalculaterUtil {

    private final RestTemplate restTemplate;

    private final Configuration config;

    public PaymentCalculaterUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public CalculationRes callPaymentCalculator(JoinCasePaymentRequest request) {
         try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getPaymentCalculatorHost()).append(config.getPaymentCalculatorEndpoint());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<JoinCasePaymentRequest> requestEntity = new HttpEntity<>(request, headers);

            ResponseEntity<CalculationRes> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, CalculationRes.class);
            log.info("Response of payment calculator :: {}",requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from payment calculator service", e);
            throw new CustomException("PAYMENT_CALCULATOR_ERROR", "Error getting response from payment calculator service");
        }
    }

    public CalculationRes callPaymentCalculator(EFillingCalculationRequest calculationRequest) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getPaymentCalculatorHost()).append(config.getCaseFilingPaymentCalculatorEndpoint());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<EFillingCalculationRequest> requestEntity = new HttpEntity<>(calculationRequest, headers);

            ResponseEntity<CalculationRes> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, CalculationRes.class);
            log.info("Response of payment calculator :: {}",requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from payment calculator service", e);
            throw new CustomException("PAYMENT_CALCULATOR_ERROR", "Error getting response from payment calculator service");
        }
    }
}
