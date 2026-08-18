package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class AdvocateUtil {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final Configuration configuration;

    @Autowired
    public AdvocateUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, Configuration configuration) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
    }

    public JsonNode searchAdvocate(RequestInfo requestInfo, String tenantId, Map<String, Object> criteria) {
        try {
            StringBuilder uri = new StringBuilder(configuration.getAdvocateHost())
                    .append(configuration.getAdvocateSearchEndPoint());

            Map<String, Object> request = new HashMap<>();
            request.put("RequestInfo", requestInfo);
            request.put("tenantId", tenantId);
            request.put("criteria", List.of(criteria));

            Object responseMap = serviceRequestRepository.fetchResult(uri, request);
            if (responseMap == null) {
                return null;
            }

            JsonNode rootNode = objectMapper.valueToTree(responseMap);
            JsonNode advocatesNode = rootNode.path("advocates");
            if (!advocatesNode.isArray() || advocatesNode.isEmpty()) {
                return null;
            }

            for (JsonNode group : advocatesNode) {
                JsonNode responseList = group.path("responseList");
                if (responseList.isArray() && !responseList.isEmpty()) {
                    return responseList.get(0);
                }
            }

            return null;
        } catch (Exception e) {
            log.error("Error while searching advocates with criteria: {}", criteria, e);
            return null;
        }
    }

    public JsonNode searchAdvocateById(RequestInfo requestInfo, String tenantId, String advocateId) {
        Map<String, Object> criteria = new HashMap<>();
        criteria.put("id", advocateId);
        return searchAdvocate(requestInfo, tenantId, criteria);
    }

    public JsonNode searchClerk(RequestInfo requestInfo, String tenantId, Map<String, Object> criteria) {
        try {
            StringBuilder uri = new StringBuilder(configuration.getAdvocateHost())
                    .append(configuration.getAdvocateClerkSearchEndPoint());

            Map<String, Object> request = new HashMap<>();
            request.put("RequestInfo", requestInfo);
            request.put("tenantId", tenantId);
            request.put("criteria", List.of(criteria));

            Object responseMap = serviceRequestRepository.fetchResult(uri, request);
            if (responseMap == null) {
                return null;
            }

            JsonNode rootNode = objectMapper.valueToTree(responseMap);
            JsonNode clerksNode = rootNode.path("clerks");
            if (!clerksNode.isArray() || clerksNode.isEmpty()) {
                return null;
            }

            for (JsonNode group : clerksNode) {
                JsonNode responseList = group.path("responseList");
                if (responseList.isArray() && !responseList.isEmpty()) {
                    return responseList.get(0);
                }
            }

            return null;
        } catch (Exception e) {
            log.error("Error while searching clerks with criteria: {}", criteria, e);
            return null;
        }
    }

    public JsonNode searchClerkById(RequestInfo requestInfo, String tenantId, String clerkId) {
        Map<String, Object> criteria = new HashMap<>();
        criteria.put("id", clerkId);
        return searchClerk(requestInfo, tenantId, criteria);
    }

    public boolean isActive(JsonNode node) {
        if (node == null) {
            return false;
        }
        JsonNode isActiveNode = node.path("isActive");
        return !isActiveNode.isMissingNode() && !isActiveNode.isNull() && isActiveNode.asBoolean();
    }

    public String getIndividualId(JsonNode node) {
        if (node == null) {
            return null;
        }
        JsonNode individualIdNode = node.path("individualId");
        if (individualIdNode.isMissingNode() || individualIdNode.isNull()) {
            return null;
        }
        return individualIdNode.asText();
    }
}
