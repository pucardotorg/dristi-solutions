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

    public JsonNode searchIndividualByIndividualId(RequestInfo requestInfo, String tenantId, String individualId) {
        try {
            StringBuilder uri = new StringBuilder(configuration.getIndividualHost())
                    .append(configuration.getIndividualSearchEndPoint())
                    .append("?limit=1")
                    .append("&offset=0")
                    .append("&tenantId=").append(tenantId);

            Map<String, Object> individual = new HashMap<>();
            individual.put("individualId", individualId);

            Map<String, Object> request = new HashMap<>();
            request.put("RequestInfo", requestInfo);
            request.put("Individual", individual);

            Object responseMap = serviceRequestRepository.fetchResult(uri, request);
            if (responseMap == null) {
                return null;
            }

            JsonNode rootNode = objectMapper.valueToTree(responseMap);
            JsonNode individualArray = rootNode.path("Individual");
            if (!individualArray.isArray() || individualArray.isEmpty()) {
                return null;
            }

            return individualArray.get(0);
        } catch (Exception e) {
            log.error("Error while searching individual by individualId: {}", individualId, e);
            return null;
        }
    }

    public String getUserUuid(JsonNode individualNode) {
        if (individualNode == null) {
            return null;
        }
        JsonNode userUuidNode = individualNode.path("userUuid");
        if (userUuidNode.isMissingNode() || userUuidNode.isNull() || userUuidNode.asText().isBlank()) {
            return null;
        }
        return userUuidNode.asText();
    }
}
