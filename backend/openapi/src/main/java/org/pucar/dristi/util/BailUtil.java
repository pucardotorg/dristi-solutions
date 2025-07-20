package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.bailbond.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_BAIL;

@Slf4j
@Component
public class BailUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;

    @Autowired
    public BailUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }

    public BailSearchResponse fetchBails(BailSearchCriteria bailCriteria, RequestInfo requestInfo) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getBailServiceHost()).append(configs.getBailServiceSearchEndpoint());

        BailSearchRequest bailSearchRequest = new BailSearchRequest();
        bailSearchRequest.setCriteria(bailCriteria);
        bailSearchRequest.setRequestInfo(requestInfo);

        Object response;
        BailSearchResponse bailResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), bailSearchRequest, Map.class);
            bailResponse = mapper.convertValue(response, BailSearchResponse.class);
            log.info("Bail response :: {}", bailResponse);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_BAIL, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_BAIL, e.getMessage());
        }
        return bailResponse;
    }

    public BailResponse updateBailBond(BailRequest bailRequest) {

        StringBuilder uri = new StringBuilder();
        uri.append(configs.getBailServiceHost()).append(configs.getBailServiceUpdateEndpoint());

        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), bailRequest, Map.class);
            return mapper.convertValue(response, BailResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_BAIL, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_BAIL, e.getMessage());
        }

    }

}
