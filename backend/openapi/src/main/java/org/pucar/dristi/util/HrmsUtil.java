package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.RequestInfoWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@Slf4j
public class HrmsUtil {

    private final Configuration configuration;
    private final RestTemplate restTemplate;

    @Autowired
    public HrmsUtil(Configuration configuration, RestTemplate restTemplate) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
    }

    public String getJudgeName(String courtId, String tenantId) {
        String uri = configuration.getHrmsHost() + configuration.getHrmsEndPoint()
                + "?tenantId=" + tenantId
                + "&limit=10"
                + "&offset=0"
                + "&sortOrder=ASC"
                + "&isActive=true"
                + "&courtrooms=" + courtId
                + "&roles=JUDGE_ROLE";

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(new RequestInfo())
                .build();

        try {
            JsonNode response = restTemplate.postForObject(uri, requestInfoWrapper, JsonNode.class);

            if (response == null || !response.has("Employees")) {
                throw new CustomException("HRMS_RESPONSE_INVALID", "No 'Employees' field found in HRMS response");
            }

            JsonNode employees = response.get("Employees");
            if (!employees.isArray() || employees.isEmpty()) {
                throw new CustomException("JUDGE_NOT_FOUND", "No judge found with specified criteria");
            }

            JsonNode employee = employees.get(0);
            JsonNode user = employee.get("user");

            if (user == null || !user.has("name")) {
                throw new CustomException("USER_NAME_MISSING", "Judge name is missing in HRMS response");
            }

            return user.get("name").asText();

        } catch (Exception e) {
            log.error("❌ Error fetching judge name from HRMS", e);
            throw new CustomException("JUDGE_FETCH_FAILED", "Error fetching judge from HRMS");
        }
    }

}
