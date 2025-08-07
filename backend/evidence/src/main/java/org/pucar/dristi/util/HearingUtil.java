package org.pucar.dristi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
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

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class HearingUtil {
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;
    private final ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public HearingUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs, ServiceRequestRepository serviceRequestRepository) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
        this.serviceRequestRepository = serviceRequestRepository;
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
}