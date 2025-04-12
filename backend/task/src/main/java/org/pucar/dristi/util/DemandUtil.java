package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.DemandCriteria;
import org.pucar.dristi.web.models.DemandRequest;
import org.pucar.dristi.web.models.DemandResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


@Component
@Slf4j
public class DemandUtil {

    private final RestTemplate restTemplate;

    private final Configuration configs;

    @Autowired
    public DemandUtil(RestTemplate restTemplate, Configuration configs) {
        this.restTemplate = restTemplate;
        this.configs = configs;
    }

    public DemandResponse searchDemand(DemandCriteria demandCriteria, RequestInfoWrapper requestInfoWrapper) {
        StringBuilder url = new StringBuilder(configs.getBillingServiceHost());
        url.append(configs.getSearchDemandEndpoint());
        url.append("?").append("tenantId=").append(demandCriteria.getTenantId());
        if(demandCriteria.getConsumerCode() != null) {
            String joinedCodes = String.join(",", demandCriteria.getConsumerCode());
            url.append("&consumerCode=").append(URLEncoder.encode(joinedCodes, StandardCharsets.UTF_8));
        }

        DemandResponse demandResponse = restTemplate.postForObject(url.toString(), requestInfoWrapper, DemandResponse.class);
        if (demandResponse == null || demandResponse.getDemands() == null || demandResponse.getDemands().isEmpty()) {
            throw new CustomException();
        }
        return demandResponse;
    }
    public DemandResponse updateDemand(DemandRequest demandRequest) {
        DemandResponse demandResponse = restTemplate.postForObject(configs.getBillingServiceHost() + configs.getUpdateDemandEndpoint(), demandRequest, DemandResponse.class);
        if (demandResponse == null || demandResponse.getDemands() == null || demandResponse.getDemands().isEmpty()) {
            throw new CustomException();
        }
        return demandResponse;
    }
}
