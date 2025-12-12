package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.cases.CaseCriteria;
import org.pucar.dristi.web.models.cases.CaseSearchRequest;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

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

    public CourtCase getCase(String filingNumber) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseSearchPath());
        CaseSearchRequest request = CaseSearchRequest.builder()
                .requestInfo(RequestInfo.builder().build())
                .criteria(Collections.singletonList(CaseCriteria.builder()
                        .filingNumber(filingNumber)
                        .defaultFields(false)
                        .build()))
                .flow("flow_jac")
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
