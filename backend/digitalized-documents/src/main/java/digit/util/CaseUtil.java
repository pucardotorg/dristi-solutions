package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.web.models.CaseCriteria;
import digit.web.models.CaseSearchRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
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

        Object response;
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
        return caseList.get(0);
    }

    public JsonNode getCaseFromFilingNumber(RequestInfo requestInfo, String filingNumber){
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .filingNumber(filingNumber)
                .defaultFields(true)
                .build();

        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(List.of(caseCriteria))
                .build();

        return searchCaseDetails(caseSearchRequest);
    }
}
