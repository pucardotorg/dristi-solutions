package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.HearingListResponse;
import org.pucar.dristi.web.models.HearingRequest;
import org.pucar.dristi.web.models.HearingSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Component
@Slf4j
public class HearingUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;

    @Autowired
    public HearingUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }

    public void updateTranscriptAdditionalAttendees(HearingRequest hearingRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getHearingHost()).append(configs.getHearingPath());
        try {
           restTemplate.postForObject(uri.toString(), hearingRequest, Map.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_UPDATING_FROM_HEARING", e);
            throw new CustomException("ERROR_WHILE_UPDATING_FROM_HEARING", e.getMessage());
        }
    }

    public List<Hearing> fetchHearingDetails(HearingSearchRequest hearingSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getHearingHost()).append(configs.getHearingSearchPath());

        Object response = new HashMap<>();
        HearingListResponse hearingListResponse = new HearingListResponse();
        try {
            response = restTemplate.postForObject(uri.toString(), hearingSearchRequest, Map.class);
            hearingListResponse = mapper.convertValue(response, HearingListResponse.class);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_HEARING", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HEARING", e.getMessage());
        }
        if(hearingListResponse==null){
            return new ArrayList<>();
        }
        return hearingListResponse.getHearingList();
    }

}
