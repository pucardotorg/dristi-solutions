package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.web.models.CaseSearchRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static digit.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;

@Component
@Slf4j
@AllArgsConstructor
public class CaseUtil {
    private final Configuration config;
    private final ObjectMapper mapper;
    private final RestTemplate restTemplate;

    public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getCaseHost()).append(config.getCaseSearchPath());

        Object response = new HashMap<>();
        JsonNode caseList = null;
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            JsonNode criteriaNode = jsonNode.get("criteria");
            if (criteriaNode != null && criteriaNode.isArray() && !criteriaNode.isEmpty()) {
                JsonNode firstCriteria = criteriaNode.get(0);
                if (firstCriteria != null) {
                    caseList = firstCriteria.get("responseList");
                }
                }
            if (caseList == null) {
                log.error("Invalid response structure from case service");
                throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, "Invalid response structure");
            }

        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
        return caseList; // List<CourtCase>
    }

    private String extractFieldFromFirstCase(JsonNode caseDetails, String fieldName) {
        if (caseDetails != null && caseDetails.isArray() && !caseDetails.isEmpty()) {
            JsonNode fieldNode = caseDetails.get(0).get(fieldName);
            if (fieldNode != null && !fieldNode.isNull()) {
                return fieldNode.textValue();
            }
        }
        log.error("{} not found", fieldName);
        return null;
    }

    public String getCourtId(JsonNode caseDetails) {
        return extractFieldFromFirstCase(caseDetails, "courtId");
    }

    public String getCaseTitle(JsonNode caseDetails) {
        return extractFieldFromFirstCase(caseDetails, "caseTitle");
    }

    public String getCnrNumber(JsonNode caseDetails) {
        return extractFieldFromFirstCase(caseDetails, "cnrNumber");
    }

    public String getCaseType(JsonNode caseDetails) {
        return extractFieldFromFirstCase(caseDetails, "caseType");
    }

    public String getCourtCaseNumber(JsonNode caseDetails) { return extractFieldFromFirstCase(caseDetails, "courtCaseNumber"); }

    public String getCmpNumber (JsonNode caseDetails) { return extractFieldFromFirstCase(caseDetails, "cmpNumber"); }

    public String getCaseId (JsonNode caseDetails) { return extractFieldFromFirstCase(caseDetails, "id"); }

    public String getSubstage(JsonNode caseDetails) { return extractFieldFromFirstCase(caseDetails, "substage"); }
}
