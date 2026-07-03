package org.egov.inbox.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.inbox.config.InboxConfiguration;
import org.egov.inbox.repository.ServiceRequestRepository;
import org.egov.inbox.web.model.AbDiaryCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class AbDiaryUtil {

    @Autowired
    private InboxConfiguration config;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    public Integer getDiaryEntryCount(AbDiaryCriteria criteria, RequestInfo requestInfo) {
        Map<String, Object> criteriaMap = new HashMap<>();
        criteriaMap.put("courtId", criteria.getCourtId());
        criteriaMap.put("tenantId", criteria.getTenantId());
        if (criteria.getDate() != null) {
            criteriaMap.put("date", criteria.getDate());
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("limit", 0);
        pagination.put("offSet", 0);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("criteria", criteriaMap);
        requestBody.put("pagination", pagination);
        requestBody.put("RequestInfo", requestInfo);

        StringBuilder uri = new StringBuilder(config.getAbDiaryHost()).append(config.getAbDiarySearchPath());
        log.info("Calling ab-diary search for count, uri: {}", uri);

        try {
            Map<String, Object> response = (Map<String, Object>) serviceRequestRepository.fetchResult(uri, requestBody);
            Integer totalCount = JsonPath.read(response, "$.pagination.totalCount");
            log.info("Ab-diary entry count: {}", totalCount);
            return totalCount;
        } catch (Exception e) {
            log.error("Error fetching ab-diary count: {}", e.getMessage());
            return 0;
        }
    }
}