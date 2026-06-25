package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseUtil {
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;
    private final ServiceRequestRepository repository;

    @Autowired
    public CaseUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs, ServiceRequestRepository repository) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
        this.repository = repository;
    }

    public Boolean fetchCaseDetails(CaseExistsRequest caseExistsRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseExistsPath());

        Object response = new HashMap<>();
        CaseExistsResponse caseExistsResponse = new CaseExistsResponse();
        try {
            response = restTemplate.postForObject(uri.toString(), caseExistsRequest, Map.class);
            caseExistsResponse = mapper.convertValue(response, CaseExistsResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());

        }
        return caseExistsResponse.getCriteria().get(0).getExists();
    }

    public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseSearchPath());

        try {
            Object response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            if (response == null) {
                throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, "Received null response from case search");
            }

            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            JsonNode criteria = jsonNode.get("criteria");
            if (criteria == null || criteria.size() == 0 || !criteria.get(0).has("responseList")) {
                throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, "Invalid response structure");
            }

            JsonNode caseList = criteria.get(0).get("responseList");
            if (caseList.size() == 0) {
                return null; // or throw an exception, depending on your requirements
            }

            // Returning the first item. Consider returning the whole list if needed.
            return caseList.get(0);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

    public void updateWitnessDetails(WitnessDetailsRequest witnessDetailsRequest) {
        StringBuilder uri = new StringBuilder(configs.getCaseHost()).append(configs.getAddWitnessEndpoint());
        Object response = repository.fetchResult(uri, witnessDetailsRequest);
        try {
            mapper.valueToTree(response);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

    public void updateCaseDetails(CaseRequest caseRequest) {
        StringBuilder uri = new StringBuilder(configs.getCaseHost()).append(configs.getUpdateCaseEndpoint());
        Object response = repository.fetchResult(uri, caseRequest);
        try {
            mapper.valueToTree(response);
        } catch (CustomException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getMessage());
        }
    }

    public CourtCase getCase(String filingNumber, String tenantId, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseSearchPath());
        CaseSearchRequest request = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(Collections.singletonList(CaseCriteria.builder()
                        .filingNumber(filingNumber)
                        .defaultFields(false)
                        .build()))
                .tenantId(tenantId)
                .build();
        try {
            Object response = repository.fetchResult(uri, request);
            return mapper.convertValue(JsonPath.read(response, COURT_CASE_JSON_PATH), CourtCase.class);
        } catch (Exception e) {
            log.error("Error executing case search query", e);
            throw new CustomException("Error fetching case: ", ERROR_CASE_SEARCH);
        }
    }
}
