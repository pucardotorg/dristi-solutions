package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import digit.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;


@Component
@Slf4j
public class HrmsUtil {

    private final RestTemplate restTemplate;

    private final Configuration configs;

    public HrmsUtil(RestTemplate restTemplate, Configuration configs) {
        this.restTemplate = restTemplate;
        this.configs = configs;
    }


    /**
     * Get judge employee for a specific courtroom based on current assignment dates.
     * @param internalRequestInfo RequestInfo for the API call
     * @param courtroom The courtroom code to filter by (e.g., "KLKM52")
     * @return The employee JsonNode if found, null otherwise
     */
    public JsonNode getJudgeForCourtroom(RequestInfo internalRequestInfo, String courtroom) {
        if (courtroom == null || courtroom.trim().isEmpty()) {
            log.warn("Courtroom parameter is null or empty");
            return null;
        }

        String tenantId = internalRequestInfo.getUserInfo().getTenantId();

        StringBuilder uri = new StringBuilder()
                .append(configs.getHrmsHost())
                .append(configs.getHrmsSearchEndpoint())
                .append("?tenantId=").append(tenantId)
                .append("&employeetypes=Judge")
                .append("&isActive=true");

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(internalRequestInfo)
                .build();

        try {
            JsonNode response = restTemplate.postForObject(uri.toString(), requestInfoWrapper, JsonNode.class);

            if (response == null || !response.has("Employees")) {
                log.warn("No 'Employees' data found in HRMS response");
                return null;
            }

            JsonNode employees = response.get("Employees");
            if (!employees.isArray() || employees.isEmpty()) {
                log.warn("No employee found in HRMS response");
                return null;
            }

            long currentTime = System.currentTimeMillis();

            for (int i = 0; i < employees.size(); i++) {
                JsonNode employee = employees.get(i);
                JsonNode assignments = employee.get("assignments");

                if (assignments == null || !assignments.isArray()) {
                    continue;
                }

                for (int j = 0; j < assignments.size(); j++) {
                    JsonNode assignment = assignments.get(j);
                    
                    JsonNode courtroomNode = assignment.get("courtroom");
                    if (courtroomNode == null || !courtroom.equals(courtroomNode.textValue())) {
                        continue;
                    }

                    JsonNode fromDateNode = assignment.get("fromDate");
                    JsonNode toDateNode = assignment.get("toDate");

                    long fromDate = (fromDateNode != null && !fromDateNode.isNull()) ? fromDateNode.asLong() : 0;
                    Long toDate = (toDateNode != null && !toDateNode.isNull()) ? toDateNode.asLong() : null;

                    // Check if current date is within assignment period
                    boolean isFromDateValid = currentTime >= fromDate;
                    boolean isToDateValid = (toDate == null) || (currentTime <= toDate);

                    if (isFromDateValid && isToDateValid) {
                        log.debug("Found judge for courtroom {}: {}", courtroom, employee.get("code").textValue());
                        return employee;
                    }
                }
            }

            log.warn("No judge found for courtroom {} with valid assignment dates", courtroom);
            return null;

        } catch (Exception e) {
            log.error("Error while fetching judge for courtroom {} from HRMS", courtroom, e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", "Error while fetching judge for courtroom from HRMS");
        }
    }
}
