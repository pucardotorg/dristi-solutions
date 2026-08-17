package org.egov.eTreasury.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.kafka.Producer;
import org.egov.eTreasury.model.HealthStatusEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.egov.eTreasury.config.PaymentConfiguration;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Supplier;

import static org.egov.eTreasury.config.ServiceConstants.CLIENT_ID_HEADER;
import static org.egov.eTreasury.config.ServiceConstants.CLIENT_SECRET_HEADER;
import static org.egov.eTreasury.config.ServiceConstants.DEPARTMENT_ID_PARAM;
import static org.egov.eTreasury.config.ServiceConstants.SOURCE_PARAM;

@Component
@Slf4j
public class ETreasuryUtil {

    private final RestTemplate restTemplate;
    private final PaymentConfiguration paymentConfiguration;
    private final Producer producer;

    @Autowired
    public ETreasuryUtil(RestTemplate restTemplate, PaymentConfiguration paymentConfiguration, Producer producer) {
        this.restTemplate = restTemplate;
        this.paymentConfiguration = paymentConfiguration;
        this.producer = producer;
    }

    private void addBasicAuthIfRequired(HttpHeaders headers) {
        if (paymentConfiguration.isTest() &&
            paymentConfiguration.getBasicAuthUsername() != null &&
            !paymentConfiguration.getBasicAuthUsername().isEmpty()) {
            headers.setBasicAuth(paymentConfiguration.getBasicAuthUsername(), paymentConfiguration.getBasicAuthPassword());
        }
    }

    private <T> ResponseEntity<T> callAndTrackHealth(String url, Supplier<ResponseEntity<T>> call) {
        long start = System.currentTimeMillis();
        try {
            ResponseEntity<T> response = call.get();
            pushHealthStatus(url, "UP", System.currentTimeMillis() - start, "HTTP " + response.getStatusCode());
            return response;
        } catch (RuntimeException e) {
            pushHealthStatus(url, "DOWN", System.currentTimeMillis() - start, e.getMessage());
            throw e;
        }
    }

    private void pushHealthStatus(String serviceUrl, String status, long elapsedMs, String message) {
        try {
            HealthStatusEvent event = HealthStatusEvent.builder()
                    .serviceName("TREASURY")
                    .serviceUrl(serviceUrl)
                    .lastStatus(status)
                    .lastUpdatedTime(System.currentTimeMillis())
                    .responseTimeMs(elapsedMs)
                    .message(message)
                    .build();
            producer.push(paymentConfiguration.getHealthStatusTopic(), event);
        } catch (Exception e) {
            log.error("Failed to push TREASURY health status to kafka: {}", e.getMessage(), e);
        }
    }

    public <T> ResponseEntity<T> callConnectionService(String url, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();

        List<MediaType> mediaTypeList = new ArrayList<>();
        mediaTypeList.add(MediaType.APPLICATION_JSON);
        headers.setAccept(mediaTypeList);
        addBasicAuthIfRequired(headers);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
        return callAndTrackHealth(url, () -> restTemplate.postForEntity(url, requestEntity, responseType));
    }

    public ResponseEntity<Object> callAuthService(String clientId, String clientSecret, String payload, String url) {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(Collections.singletonList(MediaType.ALL));

        httpHeaders.add("clientId", clientId);
        httpHeaders.add("clientSecret", clientSecret);
        addBasicAuthIfRequired(httpHeaders);

        HttpEntity<String> httpEntity = new HttpEntity<>(payload, httpHeaders);
        return callAndTrackHealth(url, () -> restTemplate.postForEntity(url, httpEntity, Object.class));
    }

    public <T> ResponseEntity<T> callService(String inputHeaders, String inputBody, String url, Class<T> responseType, MediaType mediaType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(Collections.singletonList(mediaType));

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("input_headers", inputHeaders);
        body.add("input_data", inputBody);
        addBasicAuthIfRequired(headers);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
        return callAndTrackHealth(url, () -> restTemplate.postForEntity(url, requestEntity, responseType));
    }

    public <T> ResponseEntity<T> callRefundService(String clientId, String authToken, String payload, String url,  Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.add("clientId", clientId);
        headers.add("authToken", authToken);
        addBasicAuthIfRequired(headers);

        HttpEntity<String> requestEntity = new HttpEntity<>(payload, headers);

        return callAndTrackHealth(url, () -> restTemplate.postForEntity(url, requestEntity, responseType));
    }

    public ResponseEntity<String> callTransactionDetailsV3(String departmentId, String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        addBasicAuthIfRequired(headers);

        // Updated TransactionDetailsV3.php API requires CLIENTID/CLIENTSECRET headers (in addition to basic auth).
        headers.add(CLIENT_ID_HEADER, paymentConfiguration.getReconciliationV3ClientId());
        headers.add(CLIENT_SECRET_HEADER, paymentConfiguration.getReconciliationV3ClientSecret());

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        // Updated API requires the SOURCE form param alongside DEPARTMENT_ID.
        body.add(SOURCE_PARAM, paymentConfiguration.getReconciliationV3Source());
        body.add(DEPARTMENT_ID_PARAM, departmentId);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
        return callAndTrackHealth(url, () -> restTemplate.postForEntity(url, requestEntity, String.class));
    }
}
