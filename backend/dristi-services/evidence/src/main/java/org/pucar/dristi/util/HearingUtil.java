package org.pucar.dristi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
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

import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class HearingUtil {
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;
    private final ServiceRequestRepository serviceRequestRepository;
    private final AdvocateUtil advocateUtil;
    private final JsonUtil jsonUtil;

    @Autowired
    public HearingUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs, ServiceRequestRepository serviceRequestRepository, AdvocateUtil advocateUtil, JsonUtil jsonUtil) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
        this.serviceRequestRepository = serviceRequestRepository;
        this.advocateUtil = advocateUtil;
        this.jsonUtil = jsonUtil;
    }

    public Boolean fetchHearingDetails(HearingExistsRequest hearingExistsRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getHearingHost()).append(configs.getHearingExistsPath());

        Object response = new HashMap<>();
        HearingExistsResponse hearingExistsResponse = new HearingExistsResponse();
        try {
            response = restTemplate.postForObject(uri.toString(), hearingExistsRequest, Map.class);
            hearingExistsResponse = mapper.convertValue(response, HearingExistsResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_HEARING, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_HEARING, e.getMessage());
        }
        return hearingExistsResponse.getOrder().getExists();
    }

    public List<Hearing> fetchHearing(HearingSearchRequest request) {
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configs.getHearingHost().concat(configs.getHearingSearchEndPoint()));

        Object response = serviceRequestRepository.fetchResult(uri, request);
        List<Hearing> hearingList = null;
        try {
            JsonNode jsonNode = mapper.valueToTree(response);
            JsonNode hearingListNode = jsonNode.get("HearingList");
            hearingList = mapper.readValue(hearingListNode.toString(), new TypeReference<>() {
            });
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return hearingList;
    }

    public Advocate getAdvocates(List<AdvocateMapping> representatives, List<Party> litigants, RequestInfo requestInfo) {

        List<String> complainantNames = new ArrayList<>();
        List<String> accusedNames = new ArrayList<>();
        Set<String> advocateIds = new HashSet<>();
        Set<String> individualIds = new HashSet<>();
        Set<String> advocateIndividualIds = new HashSet<>();

        Advocate advocate = Advocate.builder().build();
        advocate.setComplainant(complainantNames);
        advocate.setAccused(accusedNames);

        if (representatives != null) {
            for (AdvocateMapping representative : representatives) {
                if (representative != null && representative.getAdditionalDetails() != null) {
                    Object additionalDetails = representative.getAdditionalDetails();
                    String advocateName = jsonUtil.getNestedValue(additionalDetails, List.of("advocateName"), String.class);
                    if (advocateName != null && !advocateName.isEmpty()) {
                        List<Party> representingList = Optional.ofNullable(representative.getRepresenting())
                                .orElse(Collections.emptyList());
                        if (!representingList.isEmpty()) {
                            Party first = representingList.get(0);
                            if (first.getPartyType() != null && first.getPartyType().contains("complainant")) {
                                complainantNames.add(advocateName);
                            } else {
                                accusedNames.add(advocateName);
                            }
                        }
                    }
                }

            }

            advocateIds =  representatives.stream()
                    .map(AdvocateMapping::getAdvocateId)
                    .collect(Collectors.toSet());

            if (!advocateIds.isEmpty()) {
                advocateIndividualIds = advocateUtil.getAdvocate(requestInfo, advocateIds.stream().toList());
            }

        }

        if (litigants != null) {
            individualIds = litigants.stream()
                    .map(Party::getIndividualId)
                    .collect(Collectors.toSet());
        }

        if (!advocateIndividualIds.isEmpty()) {
            individualIds.addAll(advocateIndividualIds);
        }

        advocate.setIndividualIds(new ArrayList<>(individualIds));

        return advocate;

    }
}