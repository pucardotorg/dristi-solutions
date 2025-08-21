package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.demand.DemandCriteria;
import org.pucar.dristi.web.models.demand.DemandRequest;
import org.pucar.dristi.web.models.demand.DemandResponse;
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
        if (demandCriteria.getConsumerCode() != null) {
            String joinedCodes = String.join(",", demandCriteria.getConsumerCode());
            url.append("&consumerCode=").append(joinedCodes);
        }

        return restTemplate.postForObject(url.toString(), requestInfoWrapper, DemandResponse.class);
    }

    public DemandResponse updateDemand(DemandRequest demandRequest) {
        try {
            String url = configs.getBillingServiceHost() + configs.getUpdateDemandEndpoint();
            log.info("Updating demand with URL: {}", url);
            DemandResponse demandResponse = restTemplate.postForObject(url, demandRequest, DemandResponse.class);
            if (demandResponse == null || demandResponse.getDemands() == null || demandResponse.getDemands().isEmpty()) {
                log.error("No demands returned after update for request: {}", demandRequest);
                throw new CustomException("DEMAND_UPDATE_FAILED", "Failed to update demands or no demands returned");
            }
            return demandResponse;
        } catch (Exception e) {
            log.error("Error while updating demand: {}", e.getMessage());
            throw new CustomException("DEMAND_UPDATE_ERROR", "Error occurred while updating demands: " + e.getMessage());
        }
    }
}
