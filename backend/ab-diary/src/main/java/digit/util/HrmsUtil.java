package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import digit.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class HrmsUtil {

    private final Configuration configs;

    private final RestTemplate restTemplate;

    @Autowired
    public HrmsUtil(Configuration configs, RestTemplate restTemplate) {
        this.configs = configs;
        this.restTemplate = restTemplate;
    }

    public String getCourtId(RequestInfo requestInfo) {
        String tenantId = requestInfo.getUserInfo().getTenantId();
        String uuid = requestInfo.getUserInfo().getUuid();

        StringBuilder uri = new StringBuilder()
                .append(configs.getHrmsHost())
                .append(configs.getHrmsEndPoint())
                .append("?tenantId=").append(tenantId)
                .append("&uuids=").append(uuid);

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(requestInfo)
                .build();

        try {

            JsonNode response = restTemplate.postForObject(uri.toString(), requestInfoWrapper, JsonNode.class);

            if (response == null || !response.has("Employees")) {
                throw new CustomException("HRMS_RESPONSE_INVALID", "No 'Employees' data found in HRMS response");
            }

            JsonNode employees = response.get("Employees");
            if (!employees.isArray() || employees.isEmpty()) {
                throw new CustomException("EMPLOYEE_NOT_FOUND", "No employee found in HRMS response");
            }

            JsonNode employee = employees.get(0);
            JsonNode assignments = employee.get("assignments");

            if (assignments == null || !assignments.isArray() || assignments.isEmpty()) {
                throw new CustomException("ASSIGNMENT_NOT_FOUND", "No assignments found for employee in HRMS response");
            }

            JsonNode courtroom = assignments.get(0).get("courtroom");

            if (courtroom == null || courtroom.isNull()) {
                throw new CustomException("COURTROOM_NOT_FOUND", "Courtroom information is missing in assignment");
            }

            return courtroom.textValue();

        } catch (Exception e) {
            log.error("Error while fetching courtId from HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", "Error while fetching courtId from HRMS");
        }
    }

    public List<String> getActiveJudgeIds(RequestInfo internalRequestInfo) {

        List<String> judgeIds = new ArrayList<>();

        String tenantId = internalRequestInfo.getUserInfo().getTenantId();

        StringBuilder uri = new StringBuilder()
                .append(configs.getHrmsHost())
                .append(configs.getHrmsEndPoint())
                .append("?tenantId=").append(tenantId)
                .append("&employeetypes=Judge")
                .append("&isActive=true");

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(internalRequestInfo)
                .build();

        try {

            JsonNode response = restTemplate.postForObject(uri.toString(), requestInfoWrapper, JsonNode.class);

            if (response == null || !response.has("Employees")) {
                throw new CustomException("HRMS_RESPONSE_INVALID", "No 'Employees' data found in HRMS response");
            }

            JsonNode employees = response.get("Employees");
            if (!employees.isArray() || employees.isEmpty()) {
                throw new CustomException("EMPLOYEE_NOT_FOUND", "No employee found in HRMS response");
            }

            for (int i = 0; i < employees.size(); i++) {
                JsonNode employee = employees.get(i);
                judgeIds.add(employee.get("code").textValue());
            }

        } catch (Exception e) {
            log.error("Error while fetching courtId from HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", "Error while fetching courtId from HRMS");
        }

        return judgeIds;
    }
}