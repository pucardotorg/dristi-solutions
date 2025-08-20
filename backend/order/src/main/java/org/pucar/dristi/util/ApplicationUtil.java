package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.application.Application;
import org.pucar.dristi.web.models.application.ApplicationListResponse;
import org.pucar.dristi.web.models.application.ApplicationSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class ApplicationUtil {

    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public ApplicationUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    // return list of application
    public List<Application> searchApplications(ApplicationSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getApplicationHost()).append(configuration.getApplicationSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            ApplicationListResponse applicationSearchResult = objectMapper.readValue(jsonNode.toString(), ApplicationListResponse.class);
            return applicationSearchResult.getApplicationList();

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException(SEARCHER_SERVICE_EXCEPTION, e.getMessage()); // add log and code
        }
    }

}
