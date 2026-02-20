package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.individual.Individual;
import pucar.web.models.individual.IndividualSearchRequest;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.INDIVIDUAL_UTILITY_EXCEPTION;

@Component
@Slf4j
public class IndividualUtil {


    private final ServiceRequestRepository serviceRequestRepository;

    private final ObjectMapper objectMapper;
    private final Configuration configuration;

    @Autowired
    public IndividualUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, Configuration configuration) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
    }

    public Boolean individualCall(IndividualSearchRequest individualRequest, StringBuilder uri) {
        try {
            Object responseMap = serviceRequestRepository.fetchResult(uri, individualRequest);
            if (responseMap != null) {
                Gson gson = new Gson();
                String jsonString = gson.toJson(responseMap);
                log.info("Individual Response :: {}", jsonString);
                JsonObject response = JsonParser.parseString(jsonString).getAsJsonObject();
                JsonArray individualObject = response.getAsJsonArray("Individual");
                return !individualObject.isEmpty() && individualObject.get(0).getAsJsonObject().get("individualId") != null;
            }
            return false;
        } catch (CustomException e) {
            log.error("Custom Exception occurred in individual Utility :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            throw new CustomException(INDIVIDUAL_UTILITY_EXCEPTION, "Exception in individual utility service: " + e.getMessage());
        }
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
            throw new CustomException(INDIVIDUAL_UTILITY_EXCEPTION, "Error in individual utility service: " + e.getMessage());
        }

        return individuals;
    }

    public JsonObject getIndividual(IndividualSearchRequest individualRequest, StringBuilder uri) {
        try {
            JsonObject individual = new JsonObject();
            Object responseMap = serviceRequestRepository.fetchResult(uri, individualRequest);
            if (responseMap != null) {
                Gson gson = new Gson();
                String jsonString = gson.toJson(responseMap);
                log.info("Individual Response :: {}", jsonString);
                JsonObject response = JsonParser.parseString(jsonString).getAsJsonObject();
                JsonArray individualObject = response.getAsJsonArray("Individual");
                if (!individualObject.isEmpty() && individualObject.get(0).getAsJsonObject() != null) {
                    individual = individualObject.get(0).getAsJsonObject();
                }
            }
            return individual;
        } catch (CustomException e) {
            log.error("Custom Exception occurred in individual Utility :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            throw new CustomException(INDIVIDUAL_UTILITY_EXCEPTION, "Exception in individual utility service: " + e.getMessage());
        }
    }


    public Boolean individualExists(IndividualSearchRequest individualRequest, String tenantId, Integer limit) {

        return !getIndividualId(individualRequest, tenantId, limit).isEmpty();

    }

    public String getIndividualId(IndividualSearchRequest individualRequest, String tenantId, Integer limit) {
        StringBuilder uri = buildIndividualSearchUri(tenantId, limit);
        String individualId = "";
        JsonObject individual = getIndividual(individualRequest, uri);
        if (!ObjectUtils.isEmpty(individual) && individual.get("individualId") != null) {
            individualId = individual.get("individualId").getAsString();
        }
        return individualId;
    }

    private StringBuilder buildIndividualSearchUri(String tenantId, Integer limit) {
        return new StringBuilder(configuration.getIndividualHost())
                .append(configuration.getIndividualSearchEndPoint())
                .append("?limit=").append(limit)
                .append("&offset=0")
                .append("&tenantId=").append(tenantId);
    }
}
