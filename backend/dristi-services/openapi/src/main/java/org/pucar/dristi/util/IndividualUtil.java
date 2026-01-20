package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.Individual;
import org.pucar.dristi.web.models.IndividualSearch;
import org.pucar.dristi.web.models.IndividualSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


@Component
@Slf4j
public class IndividualUtil {


    private ServiceRequestRepository serviceRequestRepository;

    private final ObjectMapper objectMapper;

    private final Configuration config;

    @Autowired
    public IndividualUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, Configuration config) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    public List<Individual> getIndividuals(RequestInfo requestInfo, List<String> uuids, String tenantId) throws CustomException {
        try {
            IndividualSearchRequest individualSearchRequest = new IndividualSearchRequest();
            individualSearchRequest.setRequestInfo(requestInfo);
            IndividualSearch individualSearch = new IndividualSearch();
            individualSearch.setUserUuid(uuids);
            individualSearchRequest.setIndividual(individualSearch);

            StringBuilder uri = buildIndividualSearchUri(uuids, tenantId);

            List<Individual> individuals = new ArrayList<>();
            Object responseMap = serviceRequestRepository.fetchResult(uri, individualSearchRequest);
            if (responseMap != null) {
                String jsonString = objectMapper.writeValueAsString(responseMap);
                log.info("Response :: {}", jsonString);
                JsonNode rootNode = objectMapper.readTree(jsonString);

                JsonNode individualNode = rootNode.path("Individual");

                if (individualNode.isArray()) {
                    for (JsonNode node : individualNode) {
                        Individual individual = objectMapper.treeToValue(node, Individual.class);
                        individuals.add(individual);
                    }
                }
            }

            return individuals;
        } catch (Exception e) {
            log.error("Error in search individual service: ", e);
            log.error("Individuals not found");
            return Collections.emptyList();
        }
    }

    public Individual getIndividualFromMobileNumber(RequestInfo requestInfo, String mobileNumber) throws CustomException {
        try {

            IndividualSearch individualSearch = IndividualSearch.builder()
                    .mobileNumber(mobileNumber)
                    .build();

            IndividualSearchRequest individualSearchRequest = IndividualSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .individual(individualSearch)
                    .build();

            StringBuilder uri = new StringBuilder(config.getIndividualHost())
                    .append(config.getIndividualSearchEndpoint())
                    .append("?limit=1")
                    .append("&offset=0")
                    .append("&tenantId=").append(config.getEgovStateTenantId());

            Object responseMap = serviceRequestRepository.fetchResult(uri, individualSearchRequest);
            if (responseMap != null) {
                String jsonString = objectMapper.writeValueAsString(responseMap);
                log.info("Response :: {}", jsonString);
                JsonNode rootNode = objectMapper.readTree(jsonString);

                JsonNode individualNode = rootNode.path("Individual");
                JsonNode node = individualNode.get(0);
                return objectMapper.treeToValue(node, Individual.class);

            }

        } catch (Exception e) {
            log.error("Error in search individual service: ", e);
            log.error("Individual not found");
        }

        return null;
    }

    private StringBuilder buildIndividualSearchUri(List<String> userUuid, String tenantId) {
        return new StringBuilder(config.getIndividualHost())
                .append(config.getIndividualSearchEndpoint())
                .append("?limit=").append(userUuid.size())
                .append("&offset=0")
                .append("&tenantId=").append(tenantId);
    }
}
