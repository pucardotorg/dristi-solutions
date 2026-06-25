package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.ctcApplication.CtcApplication;
import org.pucar.dristi.web.models.ctcApplication.CtcApplicationSearchRequest;
import org.pucar.dristi.web.models.ctcApplication.CtcApplicationSearchResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Collections;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class CtcApplicationUtil {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final Configuration config;

    @Autowired
    public CtcApplicationUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper,
            Configuration config) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    public List<CtcApplication> searchCtcApplication(CtcApplicationSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getCtcApplicationServiceHost())
                .append(config.getCtcApplicationSearchEndpoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        try {
            CtcApplicationSearchResponse searchResponse = objectMapper.convertValue(response,
                    CtcApplicationSearchResponse.class);
            if (searchResponse != null && searchResponse.getCtcApplications() != null) {
                return searchResponse.getCtcApplications();
            } else {
                return Collections.emptyList();
            }
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException("CTC_APPLICATION_SEARCH_ERROR",
                    "Error occurred while fetching CTC application records");
        }
    }
}
