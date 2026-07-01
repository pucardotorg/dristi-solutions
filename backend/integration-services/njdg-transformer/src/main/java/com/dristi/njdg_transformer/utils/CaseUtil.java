package com.dristi.njdg_transformer.utils;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.cases.CaseSearchRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class CaseUtil {

    private final TransformerProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(properties.getCaseHost()).append(properties.getCaseSearchPath());

        Object response = new HashMap<>();
        JsonNode caseList = null;
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            JsonNode criteria = jsonNode.get("criteria");
            if (criteria == null || criteria.isEmpty() || !criteria.get(0).has("responseList")) {
                throw new CustomException("ERROR_WHILE_FETCHING_FROM_CASE", "Invalid response structure");
            }
            caseList = criteria.get(0).get("responseList");
            if (caseList.isEmpty()) {
                return null;
            }
            return caseList.get(0);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_CASE", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_CASE", e.getMessage());
        }
    }
}
