package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.advocate.Advocate;
import org.pucar.dristi.web.models.advocate.AdvocateListResponse;
import org.pucar.dristi.web.models.advocate.AdvocateSearchCriteria;
import org.pucar.dristi.web.models.advocate.AdvocateSearchRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AdvocateUtil {

    private final RestTemplate restTemplate;

    private final ObjectMapper mapper;

    private final Configuration config;

    public AdvocateUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration config) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.config = config;
    }

    public List<Advocate> getAdvocates(RequestInfo requestInfo, List<String> advocateIds) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getAdvocateHost()).append(config.getAdvocatePath());

        AdvocateSearchRequest advocateSearchRequest = new AdvocateSearchRequest();
        advocateSearchRequest.setRequestInfo(requestInfo);
        List<AdvocateSearchCriteria> criteriaList = new ArrayList<>();
        for(String id: advocateIds){
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
        List<Advocate> advocates = new ArrayList<>();

        advocateResponse.getAdvocates().forEach(advocate -> {
            List<Advocate> activeAdvocates = advocate.getResponseList().stream()
                    .filter(Advocate::getIsActive)
                    .toList();
            advocates.addAll(activeAdvocates);
        });


        return advocates;
    }
}
