package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.ADVOCATE_NOT_FOUND;
import static digit.config.ServiceConstants.ADVOCATE_NOT_FOUND_MESSAGE;
import static digit.config.ServiceConstants.INDIVIDUAL_NOT_FOUND;

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

    public String getIndividualIdFromUserUuid(RequestInfo requestInfo, String tenantId, String userUuid) {
        try {
            StringBuilder uri = new StringBuilder(configuration.getIndividualHost())
                    .append(configuration.getIndividualSearchEndPoint())
                    .append("?limit=1")
                    .append("&offset=0")
                    .append("&tenantId=").append(tenantId);

            Map<String, Object> individual = new HashMap<>();
            individual.put("userUuid", List.of(userUuid));

            Map<String, Object> request = new HashMap<>();
            request.put("RequestInfo", requestInfo);
            request.put("Individual", individual);

            Object responseMap = serviceRequestRepository.fetchResult(uri, request);
            if (responseMap == null) {
                throw new CustomException(INDIVIDUAL_NOT_FOUND,
                        String.format("Individual with uuid %s doesn't exist", userUuid));
            }

            JsonNode rootNode = objectMapper.valueToTree(responseMap);
            JsonNode individualArray = rootNode.path("Individual");
            if (!individualArray.isArray() || individualArray.isEmpty()) {
                throw new CustomException(INDIVIDUAL_NOT_FOUND,
                        String.format("Individual with uuid %s doesn't exist", userUuid));
            }

            JsonNode first = individualArray.get(0);
            JsonNode individualIdNode = first.path("individualId");
            if (individualIdNode.isMissingNode() || individualIdNode.isNull() || individualIdNode.asText().isBlank()) {
                throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
            }

            return individualIdNode.asText();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching individualId for userUuid: {}", userUuid, e);
            throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
        }
    }
}
