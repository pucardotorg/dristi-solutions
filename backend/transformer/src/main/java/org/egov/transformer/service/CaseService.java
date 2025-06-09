package org.egov.transformer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.transformer.config.ServiceConstants;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.*;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.repository.ServiceRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;

import static org.egov.transformer.config.ServiceConstants.COURT_CASE_JSON_PATH;

@Slf4j
@Service
public class CaseService {

    private static final Logger logger = LoggerFactory.getLogger(CaseService.class);


    private final ElasticSearchService elasticSearchService;
    private final TransformerProperties properties;
    private final TransformerProducer producer;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository repository;

    @Autowired
    public CaseService(ElasticSearchService elasticSearchService, TransformerProperties properties, TransformerProducer producer, ObjectMapper objectMapper, ServiceRequestRepository repository) {
        this.elasticSearchService = elasticSearchService;
        this.properties = properties;
        this.producer = producer;
        this.objectMapper = objectMapper;
        this.repository = repository;
    }

    public CourtCase fetchCase(String fieldValue) throws IOException {
        LinkedHashMap<String, Object> sourceMap = elasticSearchService.getDocumentByField(ServiceConstants.CASE_INDEX, ServiceConstants.FILING_NUMBER, fieldValue);
        if (null == sourceMap || null == sourceMap.get("Data")) {
            log.error("No case data found for {}", fieldValue);
            throw new CustomException("CASE_SEARCH_EMPTY", ServiceConstants.CASE_SEARCH_EMPTY);
        }

        CaseData data = objectMapper.convertValue(sourceMap.get("Data"), CaseData.class);
        return data.getCaseDetails();
    }

    public void updateCase(Order order) {

        try {

            CourtCase courtCase = fetchCase(order.getFilingNumber());
            if (order.getOrderType().equalsIgnoreCase(ServiceConstants.BAIL_ORDER_TYPE)) {
                courtCase.setBailOrderDetails(order);
            }
            if (order.getOrderType().equalsIgnoreCase(ServiceConstants.JUDGEMENT_ORDER_TYPE)) {
                courtCase.setJudgementOrderDetails(order);
            }

            courtCase.setAuditDetails();

            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setCases(courtCase);
            producer.push(properties.getUpdateCaseOrderTopic(), caseRequest);
        } catch (Exception e) {
            log.error("error executing case search query", e);
            throw new CustomException("ERROR_CASE_SEARCH", ServiceConstants.ERROR_CASE_SEARCH);
        }
    }

    public CourtCase getCase(String filingNumber, String tenantId, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(properties.getCaseSearchUrlHost()).append(properties.getCaseSearchUrlEndPoint());
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
            return objectMapper.convertValue(JsonPath.read(response, COURT_CASE_JSON_PATH), CourtCase.class);
        } catch (Exception e) {
            log.error("Error executing case search query", e);
            throw new CustomException("Error fetching case: ", ServiceConstants.ERROR_CASE_SEARCH);
        }
    }

    public CourtCase getCaseByCaseSearchText(String caseSearchText, String tenantId, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(properties.getCaseSearchUrlHost()).append(properties.getCaseSearchUrlEndPoint());
        CaseSearchRequest request = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(Collections.singletonList(CaseCriteria.builder()
                        .caseSearchText(caseSearchText)
                        .defaultFields(false)
                        .build()))
                .tenantId(tenantId)
                .build();
        try {
            Object response = repository.fetchResult(uri, request);
            return objectMapper.convertValue(JsonPath.read(response, COURT_CASE_JSON_PATH), CourtCase.class);
        } catch (Exception e) {
            log.error("Error executing case search query", e);
            throw new CustomException("Error fetching case: ", ServiceConstants.ERROR_CASE_SEARCH);
        }
    }

    public CourtCase getCases(CaseSearchRequest searchCaseRequest) {
        log.info("operation = getCases, result = IN_PROGRESS");

        StringBuilder url = new StringBuilder(properties.getCaseSearchUrlHost() + properties.getCaseSearchUrlEndPoint());

        Object response = repository.fetchResult(url, searchCaseRequest);
        log.info("operation = getCases, result = SUCCESS");
        return objectMapper.convertValue(JsonPath.read(response, COURT_CASE_JSON_PATH), CourtCase.class);
    }
}
