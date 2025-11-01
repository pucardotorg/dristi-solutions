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

    public List<Individual> getIndividuals(RequestInfo requestInfo, List<String> uuids) throws CustomException {
        try {
            IndividualSearchRequest individualSearchRequest = new IndividualSearchRequest();
            individualSearchRequest.setRequestInfo(requestInfo);
            IndividualSearch individualSearch = new IndividualSearch();
            individualSearch.setUserUuid(uuids);
            individualSearchRequest.setIndividual(individualSearch);
            StringBuilder uri = buildIndividualSearchUri(requestInfo, uuids);
            List<Individual> individual = getIndividualByIndividualId(individualSearchRequest, uri);
            if (individual != null) {

                return individual;
            } else {
                log.error("No individuals found");
                return Collections.emptyList();
            }
        } catch (Exception e) {
            log.error("Error in search individual service: ", e);
            log.error("Individuals not found");
            return Collections.emptyList();
        }
    }

    private StringBuilder buildIndividualSearchUri(RequestInfo requestInfo, List<String> individualId) {
        return new StringBuilder(config.getIndividualHost())
                .append(config.getIndividualSearchEndpoint())
                .append("?limit=").append(individualId.size())
                .append("&offset=0")
                .append("&tenantId=").append(requestInfo.getUserInfo().getTenantId());
    }

    public List<Individual> getIndividualByIndividualId(IndividualSearchRequest individualRequest, StringBuilder uri) {
        List<Individual> individuals = new ArrayList<>();
        try {
            Object responseMap = serviceRequestRepository.fetchResult(uri, individualRequest);
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
        } catch (Exception e) {
            log.error("Error occurred in individual utility", e);
            throw new CustomException("INDIVIDUAL_UTILITY_EXCEPTION", "Error in individual utility service: " + e.getMessage());
        }

        return individuals;
    }
}
