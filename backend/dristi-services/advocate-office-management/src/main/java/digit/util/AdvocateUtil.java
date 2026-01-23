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

import static digit.config.ServiceConstants.ADVOCATE_CLERK_NOT_FOUND;
import static digit.config.ServiceConstants.ADVOCATE_NOT_FOUND;
import static digit.config.ServiceConstants.ADVOCATE_CLERK_NOT_FOUND_MESSAGE;
import static digit.config.ServiceConstants.ADVOCATE_NOT_FOUND_MESSAGE;

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

    public void validateActiveAdvocateExists(RequestInfo requestInfo, String individualId) {
        try {
            StringBuilder uri = new StringBuilder(configuration.getAdvocateHost())
                    .append(configuration.getAdvocateSearchEndPoint());

            Map<String, Object> criteria = new HashMap<>();
            criteria.put("individualId", individualId);

            Map<String, Object> request = new HashMap<>();
            request.put("RequestInfo", requestInfo);
            request.put("criteria", List.of(criteria));

            Object responseMap = serviceRequestRepository.fetchResult(uri, request);
            if (responseMap == null) {
                throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_CLERK_NOT_FOUND_MESSAGE);
            }

            JsonNode rootNode = objectMapper.valueToTree(responseMap);
            JsonNode advocatesNode = rootNode.path("advocates");
            if (!advocatesNode.isArray() || advocatesNode.isEmpty()) {
                throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
            }

            boolean hasActive = false;
            for (JsonNode group : advocatesNode) {
                JsonNode responseList = group.path("responseList");
                if (responseList.isArray()) {
                    for (JsonNode adv : responseList) {
                        JsonNode isActiveNode = adv.path("isActive");
                        if (!isActiveNode.isMissingNode() && !isActiveNode.isNull() && isActiveNode.asBoolean()) {
                            hasActive = true;
                            break;
                        }
                    }
                }
                if (hasActive) {
                    break;
                }
            }

            if (!hasActive) {
                throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching advocate for individualId: {}", individualId, e);
            throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
        }
    }

    public void validateActiveClerkExists(RequestInfo requestInfo, String tenantId, String individualId) {
        try {
            StringBuilder uri = new StringBuilder(configuration.getAdvocateHost())
                    .append(configuration.getAdvocateClerkSearchEndPoint());

            Map<String, Object> criteria = new HashMap<>();
            criteria.put("individualId", individualId);

            Map<String, Object> request = new HashMap<>();
            request.put("RequestInfo", requestInfo);
            request.put("tenantId", tenantId);
            request.put("criteria", List.of(criteria));

            Object responseMap = serviceRequestRepository.fetchResult(uri, request);
            if (responseMap == null) {
                throw new CustomException(ADVOCATE_CLERK_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
            }

            JsonNode rootNode = objectMapper.valueToTree(responseMap);
            JsonNode clerksNode = rootNode.path("clerks");
            if (!clerksNode.isArray() || clerksNode.isEmpty()) {
                throw new CustomException(ADVOCATE_CLERK_NOT_FOUND, ADVOCATE_CLERK_NOT_FOUND_MESSAGE);
            }

            boolean hasActive = false;
            for (JsonNode group : clerksNode) {
                JsonNode responseList = group.path("responseList");
                if (responseList.isArray()) {
                    for (JsonNode clerk : responseList) {
                        JsonNode isActiveNode = clerk.path("isActive");
                        if (!isActiveNode.isMissingNode() && !isActiveNode.isNull() && isActiveNode.asBoolean()) {
                            hasActive = true;
                            break;
                        }
                    }
                }
                if (hasActive) {
                    break;
                }
            }

            if (!hasActive) {
                throw new CustomException(ADVOCATE_CLERK_NOT_FOUND, ADVOCATE_CLERK_NOT_FOUND_MESSAGE);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while validating clerk for individualId: {}", individualId, e);
            throw new CustomException(ADVOCATE_CLERK_NOT_FOUND, ADVOCATE_CLERK_NOT_FOUND_MESSAGE);
        }
    }
}
