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

    public String getCourtId(RequestInfo requestInfo) {
        String tenantId = requestInfo.getUserInfo().getTenantId();
        String uuid = requestInfo.getUserInfo().getUuid();

        StringBuilder uri = new StringBuilder()
                .append(configuration.getHrmsHost())
                .append(configuration.getHrmsEndPoint())
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


}
