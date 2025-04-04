package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.web.models.advocate.Advocate;
import pucar.web.models.advocate.AdvocateListResponse;
import pucar.web.models.advocate.AdvocateSearchCriteria;
import pucar.web.models.advocate.AdvocateSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.courtCase.Party;

import java.util.*;
import java.util.stream.Collectors;

import static pucar.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_ADVOCATE;

@Component
@Slf4j
public class AdvocateUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;
    private final JsonUtil jsonUtil;


    @Autowired
    public AdvocateUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs, JsonUtil jsonUtil) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
        this.jsonUtil = jsonUtil;
    }

    public List<Advocate> fetchAdvocates(RequestInfo requestInfo, AdvocateSearchCriteria advocateSearchCriteria) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getAdvocateHost()).append(configs.getAdvocateSearchEndPoint());

        AdvocateSearchRequest advocateSearchRequest = new AdvocateSearchRequest();
        advocateSearchRequest.setRequestInfo(requestInfo);

        List<AdvocateSearchCriteria> criteriaList = new ArrayList<>();
        criteriaList.add(advocateSearchCriteria);
        advocateSearchRequest.setCriteria(criteriaList);

        Object response;
        AdvocateListResponse advocateResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), advocateSearchRequest, Map.class);
            advocateResponse = mapper.convertValue(response, AdvocateListResponse.class);
            log.info("Advocate response :: {}", advocateResponse);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ADVOCATE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ADVOCATE, e.getMessage());
        }

        return advocateResponse.getAdvocates().get(0).getResponseList().stream().filter(Advocate::getIsActive).toList();

    }

    public List<Advocate> fetchAdvocatesById(RequestInfo requestInfo, String advocateId) {

        AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
        advocateSearchCriteria.setId(advocateId);

        return fetchAdvocates(requestInfo, advocateSearchCriteria);

    }

    public List<Advocate> fetchAdvocatesByIndividualId(RequestInfo requestInfo, String individualId) {

        AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
        advocateSearchCriteria.setIndividualId(individualId);

        return fetchAdvocates(requestInfo, advocateSearchCriteria);

    }

    public Boolean doesAdvocateExist(RequestInfo requestInfo, String advocateId) {

        List<Advocate> list = fetchAdvocatesById(requestInfo, advocateId);

        return !list.isEmpty();
    }

    public Map<String, String> getAdvocate(RequestInfo requestInfo, List<String> advocateIds) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getAdvocateHost()).append(configs.getAdvocateSearchEndPoint());

        AdvocateSearchRequest advocateSearchRequest = new AdvocateSearchRequest();
        advocateSearchRequest.setRequestInfo(requestInfo);
        List<AdvocateSearchCriteria> criteriaList = new ArrayList<>();
        for (String id : advocateIds) {
            AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
            advocateSearchCriteria.setId(id);
            criteriaList.add(advocateSearchCriteria);
        }
        advocateSearchRequest.setCriteria(criteriaList);
        Object response;
        AdvocateListResponse advocateResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), advocateSearchRequest, Map.class);
            advocateResponse = mapper.convertValue(response, AdvocateListResponse.class);
            log.info("Advocate response :: {}", advocateResponse);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_ADVOCATE", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_ADVOCATE", e.getMessage());
        }
        List<Advocate> list = new ArrayList<>();

        advocateResponse.getAdvocates().forEach(advocate -> {
            List<Advocate> activeAdvocates = advocate.getResponseList().stream()
                    .filter(Advocate::getIsActive)
                    .toList();
            list.addAll(activeAdvocates);
        });

        Map<String, String> map = new HashMap<>();

        for (Advocate advocate : list) {
            map.put(advocate.getIndividualId(), getUserName(advocate));
        }

        return map;
    }


    private String getUserName(Advocate advocate) {
        Map<String, Object> additionalDetails = (Map<String, Object>) advocate.getAdditionalDetails();
        return additionalDetails != null ? (String) additionalDetails.get("username") : null;
    }

    public Map<String, List<String>> getLitigantAdvocateMapping(CourtCase caseDetails) {
        Map<String, List<String>> litigants = new HashMap<>();

        if (caseDetails == null || caseDetails.getLitigants() == null) {
            return litigants;
        }

        for (Party litigant : caseDetails.getLitigants()) {
            List<String> list = Optional.ofNullable(caseDetails.getRepresentatives())
                    .orElse(Collections.emptyList())
                    .stream()
                    .filter(rep -> rep.getRepresenting() != null && rep.getRepresenting()
                            .stream()
                            .anyMatch(lit -> lit.getIndividualId().equals(litigant.getIndividualId()))
                            && getUUIDFromAdditionalDetails(rep.getAdditionalDetails()) != null)
                    .map(rep -> getUUIDFromAdditionalDetails(rep.getAdditionalDetails()))
                    .collect(Collectors.toList());

            String litigantUuid = getUUIDFromAdditionalDetails(litigant.getAdditionalDetails());
            if (!list.isEmpty()) {
                litigants.put(litigantUuid, list);
            } else {
                litigants.put(litigantUuid, Collections.singletonList(litigantUuid));
            }
        }
        return litigants;
    }

    private String getUUIDFromAdditionalDetails(Object additionalDetails) {
        return jsonUtil.getNestedValue(additionalDetails, List.of("uuid"), String.class);
    }


}
