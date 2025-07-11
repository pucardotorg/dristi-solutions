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
            caseList = jsonNode.get("criteria").get(0).get("responseList");

        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
        return caseList; // List<CourtCase>
    }

    public String getCourtId(JsonNode caseList) {
        if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
            JsonNode courtCaseNode = caseList.get(0).get("courtId");
            if (courtCaseNode != null && !courtCaseNode.isNull()) {
                return courtCaseNode.textValue();
            }
        }
        log.error("Court Id not found");
        return null;
    }

    public String getCaseTitle(JsonNode caseList) {
        if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
            JsonNode courtCaseNode = caseList.get(0).get("caseTitle");
            if (courtCaseNode != null && !courtCaseNode.isNull()) {
                return courtCaseNode.textValue();
            }
        }
        log.error("Case Title not found");
        return null;
    }

    public String getCnrNumber(JsonNode caseList) {
        if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
            JsonNode courtCaseNode = caseList.get(0).get("cnrNumber");
            if (courtCaseNode != null && !courtCaseNode.isNull()) {
                return courtCaseNode.textValue();
            }
        }
        log.error("Cnr Number not found");
        return null;
    }

    public String getCaseType(JsonNode caseList) {
        if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
            JsonNode courtCaseNode = caseList.get(0).get("caseType");
            if (courtCaseNode != null && !courtCaseNode.isNull()) {
                return courtCaseNode.textValue();
            }
        }
        log.error("Case Type not found");
        return null;
    }
}
