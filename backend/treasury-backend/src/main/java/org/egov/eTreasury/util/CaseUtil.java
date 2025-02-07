package org.egov.eTreasury.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.repository.ServiceRequestRepository;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class CaseUtil {

    private final PaymentConfiguration config;

    private final ServiceRequestRepository requestRepository;

    private final ObjectMapper mapper;
    public CaseUtil(PaymentConfiguration config, ServiceRequestRepository requestRepository, ObjectMapper mapper) {
        this.config = config;
        this.requestRepository = requestRepository;
        this.mapper = mapper;
    }

    public JsonNode getCases(RequestInfo requestInfo, String filingNumber) {
        log.info("operation = getCases, result = IN_PROGRESS");
        Map<String, Object> searchCaseRequest = new HashMap<>();

        Map<String, Object> caseCriteria = new HashMap<>();
        caseCriteria.put("filingNumber",  filingNumber);

        searchCaseRequest.put("RequestInfo", requestInfo);
        searchCaseRequest.put("criteria", new Object[]{caseCriteria});

        StringBuilder url = new StringBuilder(config.getCaseUrl() + config.getCaseEndpoint());

        Object response = requestRepository.fetchResult(url, searchCaseRequest);
        JsonNode caseList = null;
        if(response != null){
            try {
                JsonNode jsonNode = mapper.readTree(response.toString());
                caseList = jsonNode.get("criteria").get(0).get("responseList").get(0);
            } catch (JsonProcessingException e) {
                log.error("operation = getCases, result = FAILURE");
                throw new CustomException("DK_RR_JSON_PROCESSING_ERR", "Invalid Json response");
            }
        }

        log.info("operation = getCases, result = SUCCESS");
        return caseList;

    }

}
