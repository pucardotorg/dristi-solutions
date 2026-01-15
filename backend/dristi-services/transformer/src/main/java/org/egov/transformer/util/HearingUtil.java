package org.egov.transformer.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.Hearing;
import org.egov.transformer.models.HearingListResponse;
import org.egov.transformer.models.HearingSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
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
    private final TransformerProperties configs;

    @Autowired
    public HearingUtil(RestTemplate restTemplate, ObjectMapper mapper, TransformerProperties configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }

    public List<Hearing> fetchHearingDetails(HearingSearchRequest hearingSearchRequest) {
        if (hearingSearchRequest == null) {
            throw new IllegalArgumentException("HearingSearchRequest cannot be null");
        }

        StringBuilder uri = new StringBuilder();
        uri.append(configs.getHearingHost()).append(configs.getHearingSearchEndPoint());

        HearingListResponse hearingListResponse = new HearingListResponse();
        try {
            hearingListResponse = restTemplate.postForObject(uri.toString(), hearingSearchRequest, HearingListResponse.class);
        } catch (RestClientException e) {
            log.error("ERROR_WHILE_FETCHING_FROM_HEARING", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HEARING", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error while fetching hearing details", e);
            throw new CustomException("UNEXPECTED_ERROR_FETCHING_HEARINGS", e.getMessage());
        }
        if (hearingListResponse == null || hearingListResponse.getHearingList() == null) {
            return new ArrayList<>();
        }
        return hearingListResponse.getHearingList();
    }

}
