package org.egov.transformer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.transformer.config.ServiceConstants;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.*;
import org.egov.transformer.producer.TransformerProducer;
import org.egov.transformer.repository.ServiceRequestRepository;
import org.egov.transformer.util.DateUtil;
import org.egov.transformer.util.HearingUtil;
import org.egov.transformer.util.JsonUtil;
import org.egov.transformer.util.MdmsUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.egov.transformer.config.ServiceConstants.COURT_CASE_JSON_PATH;
import static org.egov.transformer.config.ServiceConstants.HEARING_COMPLETED_STATUS;
import static org.egov.transformer.config.ServiceConstants.HEARING_SCHEDULED_STATUS;

@Slf4j
@Service
public class CaseService {

    private static final Logger logger = LoggerFactory.getLogger(CaseService.class);


    private final ElasticSearchService elasticSearchService;
    private final TransformerProperties properties;
    private final TransformerProducer producer;
    private final ObjectMapper objectMapper;
    private final HearingUtil hearingUtil;
    private final ServiceRequestRepository repository;
    private final RestTemplate restTemplate;
    private final DateUtil dateUtil;
    private final MdmsUtil mdmsUtil;
    private final ServiceConstants serviceConstants;
    private final JsonUtil jsonUtil;

    @Autowired
    public CaseService(ElasticSearchService elasticSearchService, TransformerProperties properties, TransformerProducer producer, ObjectMapper objectMapper, HearingUtil hearingUtil, ServiceRequestRepository repository, RestTemplate restTemplate, DateUtil dateUtil, MdmsUtil mdmsUtil, ServiceConstants serviceConstants, JsonUtil jsonUtil) {
        this.elasticSearchService = elasticSearchService;
        this.properties = properties;
        this.producer = producer;
        this.objectMapper = objectMapper;
        this.hearingUtil = hearingUtil;
        this.repository = repository;
        this.restTemplate = restTemplate;
        this.dateUtil = dateUtil;
        this.mdmsUtil = mdmsUtil;
        this.serviceConstants = serviceConstants;
        this.jsonUtil = jsonUtil;
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
        caseSearch.setCourtName(getCourtName(courtCase.getTenantId(), courtCase.getCourtId()));
        caseSearch.setCourtId(courtCase.getCourtId());
        caseSearch.setTenantId(courtCase.getTenantId());
        String stNumber = courtCase.getCourtCaseNumber();
        String cmpNumber = courtCase.getCmpNumber();
        caseSearch.setStNumber(stNumber);
        caseSearch.setCmpNumber(cmpNumber);
        caseSearch.setCaseType(getCaseType(stNumber, cmpNumber));
        enrichLitigants(caseSearch, courtCase);
        enrichAdvocates(caseSearch, courtCase);
        caseSearch.setCnrNumber(courtCase.getCnrNumber());
        caseSearch.setFilingDate(courtCase.getFilingDate());
        caseSearch.setRegistrationDate(courtCase.getRegistrationDate());
        enrichLastHearingDate(courtCase.getFilingNumber(), caseSearch);
        caseSearch.setCaseStage(courtCase.getStage());
        HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder()
                        .tenantId(courtCase.getTenantId())
                        .filingNumber(courtCase.getFilingNumber())
                        .build())
                .pagination(Pagination.builder()
                        .sortBy("createdTime")
                        .order(org.egov.transformer.models.inbox.Order.DESC)
                        .build())
                .build();
        List<Hearing> hearings = hearingUtil.fetchHearingDetails(hearingSearchRequest);
        Hearing latestScheduledHearing = null;
        List<Hearing> scheduledHearings = Optional.ofNullable(hearings).orElse(Collections.emptyList()).stream()
                .filter(hearing -> HEARING_SCHEDULED_STATUS.equalsIgnoreCase(hearing.getStatus())).toList();
        if (!scheduledHearings.isEmpty()) {
            latestScheduledHearing = scheduledHearings.get(0);
        }
        caseSearch.setNextHearingDate(latestScheduledHearing!=null? latestScheduledHearing.getStartTime(): null);
        caseSearch.setCaseStatus(courtCase.getStatus());
        caseSearch.setYearOfFiling(dateUtil.getYearFromDate(courtCase.getFilingDate()));
        caseSearch.setHearingType(latestScheduledHearing!=null? latestScheduledHearing.getHearingType(): null);
        caseSearch.setCaseSubStage(courtCase.getSubstage());
        caseSearch.setOutcome(courtCase.getOutcome());
        return caseSearch;
    }

    public void enrichLastHearingDate(String filingNumber, CaseSearch caseSearch) {
        HearingCriteria criteria = HearingCriteria.builder().filingNumber(filingNumber).build();
        HearingSearchRequest request = HearingSearchRequest.builder().criteria(criteria).build();
        List<Hearing> hearingList = hearingUtil.fetchHearingDetails(request);

        if (hearingList != null && !hearingList.isEmpty()) {
            Optional<Hearing> mostRecentCompletedHearing = hearingList.stream()
                    .filter(hearing -> HEARING_COMPLETED_STATUS.equalsIgnoreCase(hearing.getStatus()))
                    .filter(hearing -> hearing.getEndTime() != null).max(Comparator.comparing(Hearing::getEndTime));
            mostRecentCompletedHearing.ifPresent(hearing -> caseSearch.setLastHearingDate(hearing.getEndTime()));
        }
        else {
            log.info("No hearings found for the case");
        }
    }

    private String getCaseType(String stNumber, String cmpNumber) {
        if(stNumber!=null) return "ST";
        else if(cmpNumber!=null) return "CMP";
        else return null;
    }

    private void enrichAdvocates(CaseSearch caseSearch, CourtCase courtCase) {
        List<Participant> advocates = new ArrayList<>();
        List<AdvocateMapping> representatives = courtCase.getRepresentatives();
        if (representatives != null) {
            for (AdvocateMapping representative : representatives) {
                Participant participant = Participant.builder().build();
                if (representative != null && representative.getAdditionalDetails() != null) {
                    Object additionalDetails = representative.getAdditionalDetails();
                    String advocateName = jsonUtil.getNestedValue(additionalDetails, List.of("advocateName"), String.class);
                    participant.setName(advocateName);
                    participant.setId(representative.getAdvocateId());
                    if (advocateName != null && !advocateName.isEmpty()) {
                        List<Party> representingList = Optional.ofNullable(representative.getRepresenting())
                                .orElse(Collections.emptyList());
                        if (!representingList.isEmpty()) {
                            Party first = representingList.get(0);
                            if (first.getPartyType() != null && first.getPartyType().contains("complainant")) {
                                participant.setEntityType("complainant");
                            } else {
                                participant.setEntityType("accused");
                            }
                        }
                    }
                }
                advocates.add(participant);
            }
        }

        caseSearch.setAdvocates(advocates);
    }

    private void enrichLitigants(CaseSearch caseSearch, CourtCase courtCase) {
        List<Participant> litigants = new ArrayList<>();
        List<Party> parties = courtCase.getLitigants();

        if (parties != null) {
            for (Party litigant : parties) {
                Participant participant = Participant.builder().build();
                if (litigant != null && litigant.getAdditionalDetails() != null) {
                    Object additionalDetails = litigant.getAdditionalDetails();
                    String litigantName = jsonUtil.getNestedValue(additionalDetails, List.of("fullName"), String.class);
                    participant.setName(litigantName);
                    participant.setId(String.valueOf(litigant.getId()));
                    if (litigant.getPartyType() != null && litigant.getPartyType().contains("complainant")) {
                        participant.setEntityType("complainant");
                    } else {
                        participant.setEntityType("accused");
                    }
                }
                litigants.add(participant);
            }
        }

        caseSearch.setLitigants(litigants);

    }

    public void publishToCaseSearchIndexer(CaseSearch caseSearch) {
        producer.push(properties.getCaseSearchTopic(), caseSearch);
    }

    public String getCourtName(String tenantId, String courtId) {
        if(tenantId==null || courtId==null){
            log.error("Cannot fetch court name as tenant id or court id is null");
            return null;
        }
        Map<String, Map<String, JSONArray>> mdmsResponse =
                mdmsUtil.fetchMdmsData(RequestInfo.builder().build(), tenantId, serviceConstants.COMMON_MASTERS_MASTER, Collections.singletonList(serviceConstants.COURT_ROOMS));
        return findCourtNameFromMdmsData(mdmsResponse, courtId);
    }

    private String findCourtNameFromMdmsData(Map<String, Map<String, JSONArray>> mdmsResponse, String courtId) {
        try{
            JSONArray courtRooms = mdmsResponse
                    .get(serviceConstants.COMMON_MASTERS_MASTER)
                    .get(serviceConstants.COURT_ROOMS);

            for (int i = 0; i < courtRooms.size(); i++) {
                Object courtRoom = courtRooms.get(i);
                String code = jsonUtil.getNestedValue(courtRoom, List.of("code"), String.class);
                if(courtId.equals(code)) return jsonUtil.getNestedValue(courtRoom, List.of("name"), String.class);
            }

        } catch (Exception e) {
            log.error("Exception while fetching court name from mdms", e);
        }

        return null;
    }

    public CourtCase getCases(CaseSearchRequest searchCaseRequest) {
        log.info("operation = getCases, result = IN_PROGRESS");

        StringBuilder url = new StringBuilder(properties.getCaseSearchUrlHost() + properties.getCaseSearchUrlEndPoint());

        Object response = repository.fetchResult(url, searchCaseRequest);
        log.info("operation = getCases, result = SUCCESS");
        return objectMapper.convertValue(JsonPath.read(response, COURT_CASE_JSON_PATH), CourtCase.class);
    }
}
