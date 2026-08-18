package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Component
@Slf4j
public class CtcUtil {

    private final ObjectMapper mapper;
    private final Configuration configs;
    private final ServiceRequestRepository repository;

    public CtcUtil(ObjectMapper mapper, Configuration configs, ServiceRequestRepository repository) {
        this.mapper = mapper;
        this.configs = configs;
        this.repository = repository;
    }

    public Boolean isPartyToCase(String ctcApplicationNumber, String courtId, RequestInfo requestInfo) {
        if (!StringUtils.hasText(ctcApplicationNumber) || !StringUtils.hasText(courtId)) {
            return null;
        }

        String tenantId = deriveTenantIdFromCourtId(courtId);
        if (!StringUtils.hasText(tenantId)) {
            return null;
        }

        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCtcHost()).append(configs.getCtcSearchEndpoint());

        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo != null ? requestInfo : RequestInfo.builder().build());

        Map<String, Object> criteria = new HashMap<>();
        criteria.put("tenantId", tenantId);
        criteria.put("ctcApplicationNumber", ctcApplicationNumber);
        request.put("criteria", criteria);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("limit", 1);
        pagination.put("offSet", 0);
        request.put("pagination", pagination);

        try {
            Object response = repository.fetchResult(uri, request);
            JsonNode root = mapper.convertValue(response, JsonNode.class);
            JsonNode applications = root.get("ctcApplications");
            if (applications == null || !applications.isArray() || applications.isEmpty()) {
                return null;
            }

            JsonNode app = applications.get(0);
            JsonNode isParty = app.get("isPartyToCase");
            if (isParty == null || isParty.isNull()) {
                return null;
            }

            return isParty.asBoolean();
        } catch (Exception e) {
            log.error("Error searching CTC application for ctcApplicationNumber: {}", ctcApplicationNumber, e);
            return null;
        }
    }

    public void updateCtcApplication(Map<String, Object> ctcApplication, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCtcHost()).append(configs.getCtcUpdateEndpoint());

        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo != null ? requestInfo : RequestInfo.builder().build());
        request.put("ctcApplication", ctcApplication);

        try {
            repository.fetchResult(uri, request);
            log.info("Successfully updated CTC application");
        } catch (Exception e) {
            log.error("Error updating CTC application", e);
        }
    }

    private String deriveTenantIdFromCourtId(String courtId) {
        if (!StringUtils.hasText(courtId) || courtId.length() < 2) {
            return null;
        }
        return courtId.substring(0, 2).toLowerCase(Locale.ROOT);
    }
}
