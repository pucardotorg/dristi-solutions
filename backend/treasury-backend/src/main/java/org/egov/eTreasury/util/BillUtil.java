package org.egov.eTreasury.util;

import com.fasterxml.jackson.databind.JsonNode;
import digit.models.coremodels.RequestInfoWrapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
@Slf4j
public class BillUtil {

    private final PaymentConfiguration config;

    private final RestTemplate restTemplate;
    public BillUtil(PaymentConfiguration config, RestTemplate restTemplate) {
        this.config = config;
        this.restTemplate = restTemplate;
    }

    public JsonNode searchBill(RequestInfo requestInfo, String billId){
        MultiValueMap<String, String> queryParams = new LinkedMultiValueMap<>();
        queryParams.add("tenantId", config.getEgovStateTenantId());
        queryParams.add("billId", StringUtils.join(billId,","));

        String uri = UriComponentsBuilder
                .fromHttpUrl(config.getBillHost())
                .path(config.getBillV2Endpoint())
                .queryParams(queryParams)
                .build()
                .toUriString();

        RequestInfoWrapper wrapper = new RequestInfoWrapper(requestInfo);

        try {
            JsonNode response = restTemplate.postForObject(uri, wrapper, JsonNode.class);
            return response.get("Bill").get(0);
        } catch (HttpClientErrorException e) {
            log.error("Unable to fetch bill for Bill ID: {}", billId, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Unable to fetch bill for Bill ID: {}", billId, e);
            throw new CustomException("BILLING_SERVICE_ERROR", "Failed to fetch bill, unknown error occurred");
        }
    }
}
