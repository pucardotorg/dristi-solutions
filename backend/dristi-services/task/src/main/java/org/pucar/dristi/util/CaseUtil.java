package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final ServiceRequestRepository repository;

    private final ObjectMapper objectMapper;

    @Autowired
    public CaseUtil(Configuration config, RestTemplate restTemplate, ObjectMapper mapper, ServiceRequestRepository repository, ObjectMapper objectMapper) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.mapper = mapper;

        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public JsonNode searchCaseDetails(RequestInfo requestInfo, String tenantId, String cnrNumber, String filingNumber, String caseId) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getCaseHost()).append(config.getCaseSearchPath());
        Gson gson = new Gson();
        String requestInfoJson = gson.toJson(requestInfo);
        JSONObject requestIn = new JSONObject(requestInfoJson);
        JSONObject caseSearchRequest = new JSONObject();
        caseSearchRequest.put(REQUEST_INFO,requestIn);
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

//        Object response;
        try {

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> requestEntity = new HttpEntity<>(caseSearchRequest.toString(), headers);
            String response = restTemplate.exchange(uri.toString(), HttpMethod.POST, requestEntity, String.class).getBody();
            JsonNode jsonNode = mapper.readTree(response);
            return jsonNode.path("criteria").path(0).path("responseList");
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

    public List<CourtCase> getCaseDetails(TaskRequest taskRequest) {

        String filingNumber = taskRequest.getTask().getFilingNumber();
        RequestInfo requestInfo = taskRequest.getRequestInfo();

        StringBuilder uri = new StringBuilder();
        uri.append(config.getCaseHost()).append(config.getCaseSearchPath());

        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber)
                .defaultFields(false)
                .build();

        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(Collections.singletonList(caseCriteria))
                .build();

        Object response;
        CaseListResponse caseListResponse;

        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            caseListResponse = objectMapper.convertValue(response,CaseListResponse.class);
            log.info("Case response : {} ", caseListResponse);
        }
        catch (Exception e) {
            log.error("Error while fetching from case service");
            throw new CustomException(ERROR_FROM_CASE,e.getMessage());
        }

        if (caseListResponse != null && caseListResponse.getCriteria() != null && !caseListResponse.getCriteria().isEmpty()) {
            return caseListResponse.getCriteria().get(0).getResponseList();
        }
        return null;
    }

    public void editCase(RequestInfo requestInfo, CourtCase courtCase) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getCaseHost()).append(config.getCaseEditPath());
        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("RequestInfo", requestInfo);
        requestMap.put("cases", courtCase);
        try {
            repository.fetchResult(uri, requestMap);
        } catch (Exception e) {
            log.error("Error while editing case", e);
            throw new CustomException(ERROR_FROM_CASE, e.getMessage());
        }
    }

    public List<Party> getRespondentOrComplainant(CourtCase caseDetails, String type) {
        return caseDetails.getLitigants()
                .stream()
                .filter(item -> item.getPartyType().contains(type))
                .collect(Collectors.toList());
    }

    public Map<String, List<POAHolder>> getLitigantPoaMapping(CourtCase cases) {
        List<String> litigantIds = Optional.ofNullable(cases.getLitigants()).orElse(Collections.emptyList()).stream().filter(Party::getIsActive).map(Party::getIndividualId).filter(Objects::nonNull).toList();
        Map<String, List<POAHolder>> litigantPoaMapping = Optional.ofNullable(cases.getPoaHolders())
                .orElse(Collections.emptyList())
                .stream()
                .filter(POAHolder::getIsActive)
                .flatMap(poa -> {
                    // Create pairs of (litigantId, poa) for each litigant this POA represents
                    return poa.getRepresentingLitigants().stream()
                            .filter(party -> party.getIndividualId() != null)
                            .map(party -> new AbstractMap.SimpleEntry<>(party.getIndividualId(), poa));
                })
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,  // Group by litigant ID
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                ));

        for (String id : litigantIds) {
            litigantPoaMapping.putIfAbsent(id, new ArrayList<>()); // fill in missing ones with empty list
        }
        return litigantPoaMapping;
    }
}
