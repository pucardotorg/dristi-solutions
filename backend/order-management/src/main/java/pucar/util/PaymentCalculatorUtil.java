package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.web.models.calculator.CalculationRes;
import pucar.web.models.calculator.TaskPaymentRequest;

@Component
@Slf4j
public class PaymentCalculatorUtil {

    private final RestTemplate restTemplate;
    private final Configuration config;

    public PaymentCalculatorUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public CalculationRes callPaymentCalculator(TaskPaymentRequest request) {
        try {
            String uri = config.getPaymentCalculatorHost() + config.getPaymentCalculatorEndpoint();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskPaymentRequest> requestEntity = new HttpEntity<>(request, headers);

            ResponseEntity<CalculationRes> responseEntity = restTemplate.postForEntity(uri,
                    requestEntity, CalculationRes.class);
            log.info("Response of payment calculator :: {}", requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from payment calculator service", e);
            throw new CustomException("PAYMENT_CALCULATOR_ERROR", "Error getting response from payment calculator service");
        }
    }
}
