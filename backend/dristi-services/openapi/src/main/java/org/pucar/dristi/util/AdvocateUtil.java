package org.pucar.dristi.util;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_ADVOCATE;

import java.util.*;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.AdvocateListResponse;
import org.pucar.dristi.web.models.AdvocateSearchCriteria;
import org.pucar.dristi.web.models.AdvocateSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AdvocateUtil {

    private RestTemplate restTemplate;

    private ObjectMapper mapper;

    private Configuration configs;


    @Autowired
    public AdvocateUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }

    public List<Advocate> fetchAdvocates(AdvocateSearchCriteria advocateSearchCriteria) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getAdvocateHost()).append(configs.getAdvocatePath());

        AdvocateSearchRequest advocateSearchRequest = new AdvocateSearchRequest();

        List<AdvocateSearchCriteria> criteriaList = new ArrayList<>();
        criteriaList.add(advocateSearchCriteria);
        advocateSearchRequest.setCriteria(criteriaList);
        advocateSearchRequest.setRequestInfo(RequestInfo.builder().userInfo(User.builder().build()).build());

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

    public List<Advocate> fetchAdvocatesByBarRegistrationNumber(String barRegistrationNumber) {

        AdvocateSearchCriteria advocateSearchCriteria = new AdvocateSearchCriteria();
        advocateSearchCriteria.setBarRegistrationNumber(barRegistrationNumber);

        return fetchAdvocates(advocateSearchCriteria);

    }

}