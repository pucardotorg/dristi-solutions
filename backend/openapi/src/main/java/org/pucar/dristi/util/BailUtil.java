package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.Bail;
import org.pucar.dristi.web.models.BailCriteria;
import org.pucar.dristi.web.models.BailSearchRequest;
import org.pucar.dristi.web.models.BailListResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_BAIL;

@Slf4j
@Component
public class BailUtil {

    private RestTemplate restTemplate;
    private ObjectMapper mapper;
    private Configuration configs;

    @Autowired
    public BailUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }

    public BailListResponse fetchBails(BailCriteria bailCriteria) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getBailServiceHost()).append("/v1/search");

        BailSearchRequest bailSearchRequest = new BailSearchRequest();
        List<BailCriteria> criteriaList = new ArrayList<>();
        criteriaList.add(bailCriteria);
        bailSearchRequest.setCriteria(criteriaList);
        bailSearchRequest.setRequestInfo(RequestInfo.builder().userInfo(User.builder().build()).build());

        Object response;
        BailListResponse bailResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), bailSearchRequest, Map.class);
            bailResponse = mapper.convertValue(response, BailListResponse.class);
            log.info("Bail response :: {}", bailResponse);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_BAIL, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_BAIL, e.getMessage());
        }
        return bailResponse;
    }

    public BailListResponse fetchBailByBailIdAndMobileNumber(String tenantId, String bailId, String mobileNumber) {
        BailCriteria bailSearchCriteria = new BailCriteria();
        bailSearchCriteria.setTenantId(tenantId);
        bailSearchCriteria.setBailId(bailId);
        bailSearchCriteria.setMobileNumber(mobileNumber);

        return fetchBails(bailSearchCriteria);
    }
}
