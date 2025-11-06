package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.web.models.CaseSearchRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static digit.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;


@Slf4j
@Component
@RequiredArgsConstructor
public class CaseUtil {

    private final Configuration configs;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseSearchEndPoint());

        Object response = new HashMap<>();
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            JsonNode caseList = jsonNode.get("criteria").get(0).get("responseList");
            return caseList.get(0);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }
}