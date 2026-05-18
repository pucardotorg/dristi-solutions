package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class BailBondUtil {

    private final Configuration config;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public BailBondUtil(Configuration config, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper) {
        this.config = config;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }

    public String fetchBailStatusByFilingNumber(RequestInfo requestInfo, String filingNumber, String tenantId) {
        try {
            StringBuilder uri = new StringBuilder(config.getBailBondHost()).append(config.getBailBondSearchPath());

            Map<String, Object> criteria = new HashMap<>();
            criteria.put("filingNumber", filingNumber);
            criteria.put("tenantId", tenantId);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("RequestInfo", requestInfo);
            requestBody.put("criteria", criteria);

            Object response = serviceRequestRepository.fetchResult(uri, requestBody);
            JsonNode root = objectMapper.convertValue(response, JsonNode.class);

            if (root != null && root.has("bails") && root.get("bails").isArray() && root.get("bails").size() > 0) {
                JsonNode firstBail = root.get("bails").get(0);
                if (firstBail.has("status") && !firstBail.get("status").isNull()) {
                    return firstBail.get("status").asText();
                }
            }
        } catch (Exception e) {
            log.error("Error fetching bail-bond status for filingNumber: {}", filingNumber, e);
        }
        return null;
    }
}
