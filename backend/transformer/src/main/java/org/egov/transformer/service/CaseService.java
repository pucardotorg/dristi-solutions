package org.egov.transformer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.transformer.config.ServiceConstants;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.CaseCriteria;
import org.egov.transformer.models.CaseData;
import org.egov.transformer.models.CaseRequest;
import org.egov.transformer.models.CaseSearch;
import org.egov.transformer.models.CaseSearchRequest;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.Hearing;
import org.egov.transformer.models.HearingCriteria;
import org.egov.transformer.models.HearingSearchRequest;
import org.egov.transformer.models.Order;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.repository.ServiceRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private final HearingService hearingService;
    private final RestTemplate restTemplate;

    @Autowired
    public CaseService(ElasticSearchService elasticSearchService, TransformerProperties properties, TransformerProducer producer, ObjectMapper objectMapper, ServiceRequestRepository repository, HearingService hearingService, RestTemplate restTemplate) {
        this.elasticSearchService = elasticSearchService;
        this.properties = properties;
        this.producer = producer;
        this.objectMapper = objectMapper;
        this.repository = repository;
        this.hearingService = hearingService;
        this.restTemplate = restTemplate;
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

    public CaseSearch getCaseSearchFromCourtCase(CourtCase courtCase) {
        CaseSearch caseSearch = new CaseSearch();
        caseSearch.setCaseTitle(courtCase.getCaseTitle());
        caseSearch.setFilingNumber(courtCase.getFilingNumber());
        caseSearch.setCourtName(getCourtName(courtCase.getCourtId()));
        caseSearch.setCourtId(courtCase.getCourtId());
        caseSearch.setTenantId(courtCase.getTenantId());
        courtCase.setCmpNumber(courtCase.getCmpNumber());
        caseSearch.setCaseType(courtCase.getCaseType());
        caseSearch.setCnrNumber(courtCase.getCnrNumber());
        // next hearing date?
        caseSearch.setCaseStage(courtCase.getStage());
        caseSearch.setCaseStatus(courtCase.getStatus());
        Date filingDate = new Date(courtCase.getFilingDate());
        caseSearch.setYearOfFiling(String.valueOf(filingDate.getYear()));
        HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder()
                        .tenantId(courtCase.getTenantId())
                        .build())
                .build();
        Hearing hearing = hearingService.fetchHearing(hearingSearchRequest).get(0);
        caseSearch.setHearingType(hearing.getHearingType());
        return caseSearch;

    }

    public void publishToCaseSearchIndexer(CaseSearch caseSearch) {
        producer.push(properties.getCaseSearchTopic(), caseSearch);
    }

    public String getCourtName(String courtId) {
        String url = "https://dristi-kerala-dev.pucar.org/egov-mdms-service/v2/_search";

        String jsonBody = """
        {"MdmsCriteria":{"tenantId":"kl","filters":{},"schemaCode":"common-masters.Court_Rooms","limit":10,"offset":0},"RequestInfo":{"apiId":"Rainmaker","authToken":"9a8b370e-484e-4443-8153-0bb219bc6d78","userInfo":{"id":498,"uuid":"d4308cee-8733-41c0-8059-26c2c7050b92","userName":"mdmsv2Super","name":"mdms","mobileNumber":"7012345622","emailId":"","locale":null,"type":"EMPLOYEE","roles":[{"name":"HRMS_ADMIN","code":"HRMS_ADMIN","tenantId":"kl"},{"name":"Localisation admin","code":"LOC_ADMIN","tenantId":"kl"},{"name":"MDMS ADMIN","code":"MDMS_ADMIN","tenantId":"kl"},{"name":"Employee","code":"EMPLOYEE","tenantId":"kl"}],"active":true,"tenantId":"kl","permanentCity":"KOLLAM"},"msgId":"1750678375540|en_IN","plainAccessRequest":{}}}
        """;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> requestEntity = new HttpEntity<>(jsonBody, headers);
        String response =  restTemplate.postForObject(url, requestEntity, String.class);

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = null;
        try {
            root = objectMapper.readTree(response);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        for (JsonNode node : root.path("mdms")) {
            JsonNode data = node.path("data");
            if (data.path("code").asText().equals(courtId)) {
                return data.path("name").asText();
            }
        }
        return null;
    }
}
