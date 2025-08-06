package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;
import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;

@Slf4j
@Component
public class CaseUtil {
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;
    private final ServiceRequestRepository repository;
    private final CacheUtil cacheUtil;

    @Autowired
    public CaseUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs, ServiceRequestRepository repository, CacheUtil cacheUtil) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
        this.repository = repository;
        this.cacheUtil = cacheUtil;
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

    public List<CourtCase> getCaseDetailsForSingleTonCriteria(CaseSearchRequest caseSearchRequest) {

        // add redis cache here based on filing number
        Object courtCase = cacheUtil.findById(caseSearchRequest.getCriteria().get(0).getTenantId() + ":" + caseSearchRequest.getCriteria().get(0).getFilingNumber());
        if (courtCase != null) {
            return List.of(mapper.convertValue(courtCase, CourtCase.class));
        }
        JsonNode jsonNodeCaseListResponse = searchCaseDetails(caseSearchRequest);
        CaseListResponse caseListResponse = mapper.convertValue(jsonNodeCaseListResponse, CaseListResponse.class);
        cacheUtil.save(caseListResponse.getCriteria().get(0).getTenantId() + ":" + caseListResponse.getCriteria().get(0).getFilingNumber(),
                caseListResponse.getCriteria().get(0).getResponseList().get(0));
        return caseListResponse.getCriteria().get(0).getResponseList();
    }
}
