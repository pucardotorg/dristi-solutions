package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.BillResponse;
import org.pucar.dristi.web.models.RequestInfoWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;

@Service
@Slf4j
public class BillingUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;

    @Autowired
    public BillingUtil(Configuration config, RestTemplate restTemplate) {
        this.config = config;
        this.restTemplate = restTemplate;
    }

    public boolean billExists(RequestInfo requestInfo, String tenantId, String consumerCode, String service) {
        try {
            String uri = UriComponentsBuilder
                    .fromHttpUrl(config.getBillingHost() + config.getEtreasuryBillSearchPath())
                    .queryParam("tenantId", tenantId)
                    .queryParam("consumerCode", consumerCode)
                    .queryParam("service", service)
                    .toUriString();

            RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                    .requestInfo(requestInfo)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            HttpEntity<RequestInfoWrapper> requestEntity = new HttpEntity<>(requestInfoWrapper, headers);

            log.info("Searching for existing bill with consumerCode: {} and service: {}", consumerCode, service);

            ResponseEntity<BillResponse> response = restTemplate.postForEntity(uri, requestEntity, BillResponse.class);
            BillResponse billResponse = response.getBody();

            boolean billExists = billResponse != null &&
                    billResponse.getBill() != null &&
                    !billResponse.getBill().isEmpty();
            log.info("Bill search result - billExists: {}", billExists);
            return billExists;

        } catch (Exception e) {
            log.error("Error searching for bill: {}", e.getMessage(), e);
            return false;
        }
    }
}
