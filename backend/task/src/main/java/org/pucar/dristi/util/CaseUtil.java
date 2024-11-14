package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;

@Slf4j
@Component
public class CaseUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    @Autowired
    public CaseUtil(Configuration config, RestTemplate restTemplate, ObjectMapper mapper) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.mapper = mapper;

    }

    public JsonNode searchCaseDetails(JSONObject caseSearchRequest, String tenantId, String cnrNumber, String filingNumber, String caseId) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getCaseHost()).append(config.getCaseSearchPath());

        caseSearchRequest.put("tenantId", tenantId);
        JSONArray criteriaArray = new JSONArray();
        JSONObject criteria = new JSONObject();

        if (cnrNumber != null) {
            criteria.put("cnrNumber", cnrNumber);
        }
        if (filingNumber != null) {
            criteria.put("filingNumber", filingNumber);
        }
        if (caseId != null) {
            criteria.put("caseId", caseId);
        }
        criteriaArray.put(criteria);
        caseSearchRequest.put("criteria", criteriaArray);

        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            return jsonNode.get("criteria").get(0).get("responseList");
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

}
