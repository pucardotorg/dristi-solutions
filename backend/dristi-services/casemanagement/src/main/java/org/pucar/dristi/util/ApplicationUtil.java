package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.application.ApplicationCriteria;
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
    private final CacheUtil cacheUtil;

    @Autowired
    public ApplicationUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, CacheUtil cacheUtil) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.cacheUtil = cacheUtil;
    }

    // return list of application
    public List<Application> searchApplications(String filingNumber,String courtId) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getApplicationHost()).append(configuration.getApplicationSearchEndPoint());
        ApplicationSearchRequest applicationSearchRequest = ApplicationSearchRequest.builder().criteria(ApplicationCriteria.builder().filingNumber(filingNumber).courtId(courtId).build()).build();
        Object response = serviceRequestRepository.fetchResult(uri, applicationSearchRequest);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            ApplicationListResponse applicationSearchResult = objectMapper.readValue(jsonNode.toString(), ApplicationListResponse.class);
            cacheUtil.save(applicationSearchResult.getApplicationList().get(0).getTenantId() + ":" + applicationSearchResult.getApplicationList().get(0).getApplicationNumber(), applicationSearchResult.getApplicationList().get(0));
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
