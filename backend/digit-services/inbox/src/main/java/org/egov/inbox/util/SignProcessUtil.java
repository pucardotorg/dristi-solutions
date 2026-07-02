package org.egov.inbox.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.inbox.config.InboxConfiguration;
import org.egov.inbox.repository.ServiceRequestRepository;
import org.egov.inbox.web.model.SignProcessCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class SignProcessUtil {

    @Autowired
    private InboxConfiguration config;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    public Integer getSignProcessCount(SignProcessCriteria criteria, RequestInfo requestInfo) {
        Map<String, Object> criteriaMap = new HashMap<>();
        if (criteria.getCompleteStatus() != null) criteriaMap.put("completeStatus", criteria.getCompleteStatus());
        if (criteria.getOrderType() != null) criteriaMap.put("orderType", criteria.getOrderType());
        if (criteria.getDeliveryChanel() != null) criteriaMap.put("deliveryChanel", criteria.getDeliveryChanel());
        if (criteria.getApplicationStatus() != null) criteriaMap.put("applicationStatus", criteria.getApplicationStatus());
        if (criteria.getIsPendingCollection() != null) criteriaMap.put("isPendingCollection", criteria.getIsPendingCollection());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("limit", 0);
        pagination.put("offSet", 0);
        pagination.put("sortBy", "lastmodifiedtime");
        pagination.put("order", "desc");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("apiOperation", "SEARCH");
        requestBody.put("criteria", criteriaMap);
        requestBody.put("tenantId", criteria.getTenantId());
        requestBody.put("pagination", pagination);
        requestBody.put("RequestInfo", requestInfo);

        StringBuilder uri = new StringBuilder(config.getTaskServiceHost())
                .append(config.getTaskTableSearchPath())
                .append("?tenantId=").append(criteria.getTenantId())
                .append("&limit=0&offset=0");

        log.info("Calling task service for sign process count, uri: {}", uri);

        try {
            Map<String, Object> response = (Map<String, Object>) serviceRequestRepository.fetchResult(uri, requestBody);
            Integer totalCount = JsonPath.read(response, "$.TotalCount");
            log.info("Sign process TotalCount: {}", totalCount);
            return totalCount;
        } catch (Exception e) {
            log.error("Error fetching sign process count: {}", e.getMessage());
            return 0;
        }
    }
}