package org.egov.eTreasury.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.CaseListResponse;
import org.egov.eTreasury.model.CaseSearchRequest;
import org.egov.eTreasury.model.CourtCase;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class CaseUtil {

    private final PaymentConfiguration configuration;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public CaseUtil(PaymentConfiguration configuration, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public CourtCase searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseHost()).append(configuration.getCaseSearchEndPoint());

        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = objectMapper.readTree(objectMapper.writeValueAsString(response));
            CaseListResponse caseListResponse = objectMapper.convertValue(jsonNode, CaseListResponse.class);
            return caseListResponse.getCriteria().get(0).getResponseList().get(0);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_CASE", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_CASE", e.getMessage());
        }
    }

}
