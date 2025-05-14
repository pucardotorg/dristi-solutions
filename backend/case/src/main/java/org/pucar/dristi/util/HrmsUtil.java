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

    private final Configuration configs;

    private final RestTemplate restTemplate;

    @Autowired
    public HrmsUtil(Configuration configs, RestTemplate restTemplate) {
        this.configs = configs;
        this.restTemplate = restTemplate;
    }

    public void getEmployeeDetails(String userUid) {

        try {
            StringBuilder uri = new StringBuilder();
            uri.append(configs.getHrmsHost()).append(configs.getHrmsEndPoint());
            uri.append("?").append("tenantId").append("=").append(configs.getTenantId());
            uri.append("&").append("uuids").append("=").append(userUid);
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", e.getMessage());
        }

    }

    public String getJudgeId(RequestInfo requestInfo) {

        try {

            String userUid = requestInfo.getUserInfo().getUuid();

            String uri = configs.getHrmsHost() + configs.getHrmsEndPoint() +
                    "?" + "tenantId" + "=" + configs.getTenantId() +
                    "&" + "uuids" + "=" + userUid;

            RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
            JsonNode object = restTemplate.postForObject(uri, requestInfoWrapper, JsonNode.class);
            restTemplate.postForObject(uri, requestInfoWrapper, JsonNode.class).get("Employees").get(0).get("assignments").get(0);
            return null;

        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_FROM_HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", e.getMessage());
        }

    }

}
