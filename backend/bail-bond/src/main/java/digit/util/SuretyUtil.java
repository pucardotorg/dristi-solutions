package digit.util;

import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.ERROR_WHILE_CREATING_SURETY;
import static digit.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_SURETY;

@Slf4j
@Component
public class SuretyUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration configs;

    @Autowired
    public SuretyUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration configs) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.configs = configs;
    }

    public List<Surety> createSurety(Surety surety, RequestInfo requestInfo) {
        String uri = configs.getSuretyHost() + configs.getSuretyCreateEndpoint();

        SuretyRequest createRequest = new SuretyRequest();
        createRequest.setSurety(surety);
        createRequest.setRequestInfo(requestInfo);

        Object response;
        SuretyResponse suretyResponse;
        try {
            response = restTemplate.postForObject(uri, createRequest, Object.class);
            suretyResponse = mapper.convertValue(response, SuretyResponse.class);
            log.info("Surety create response :: {}", suretyResponse);
        } catch (Exception e) {
            log.error(ERROR_WHILE_CREATING_SURETY, e);
            throw new CustomException(ERROR_WHILE_CREATING_SURETY, e.getMessage());
        }

        if (suretyResponse != null && suretyResponse.getSureties() != null) {
            return suretyResponse.getSureties();
        }
        throw new CustomException(ERROR_WHILE_CREATING_SURETY, "Failed to create surety");
    }

    public List<Surety> searchSuretiesByCriteria(SuretySearchCriteria criteria, RequestInfo requestInfo) {
        String uri = configs.getSuretyHost() + configs.getSuretySearchEndpoint();

        SuretySearchRequest suretySearchRequest = new SuretySearchRequest();
        suretySearchRequest.setCriteria(criteria);
        suretySearchRequest.setRequestInfo(requestInfo);

        Object response;
        SuretySearchResponse suretyResponse;
        try {
            response = restTemplate.postForObject(uri, suretySearchRequest, Map.class);
            suretyResponse = mapper.convertValue(response, SuretySearchResponse.class);
            log.info("Surety search response :: {}", suretyResponse);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_SURETY, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_SURETY, e.getMessage());
        }

        if (suretyResponse.getSureties() != null) {
            return suretyResponse.getSureties();
        }
        return Collections.emptyList();
    }

}
