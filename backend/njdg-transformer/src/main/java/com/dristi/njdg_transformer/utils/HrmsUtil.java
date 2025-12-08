package com.dristi.njdg_transformer.utils;


import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.hrms.EmployeeResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.models.coremodels.RequestInfoWrapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class HrmsUtil {

    private final TransformerProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final UrlValidator urlValidator;

    public HrmsUtil(TransformerProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper, UrlValidator urlValidator) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.urlValidator = urlValidator;
    }

    public EmployeeResponse getEmployeeDetails(String tenantId, String employeeId, RequestInfo requestInfo){
        // Validate inputs to prevent SSRF attacks
        String validatedTenantId = urlValidator.validateTenantId(tenantId);
        String validatedEmployeeId = urlValidator.validateIdentifier(employeeId, "EMPLOYEE_ID");
        
        // Construct the complete URI using safe URL builder
        String uri = urlValidator.buildSafeUri(
                properties.getHrmsHost(),
                properties.getHrmsEndPoint(),
                "tenantId", validatedTenantId,
                "codes", validatedEmployeeId
        );

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(requestInfo)
                .build();

        try {
            JsonNode response = restTemplate.postForObject(uri, requestInfoWrapper, JsonNode.class);
            return objectMapper.convertValue(response, EmployeeResponse.class);
        } catch (Exception e) {
            log.error("Error while fetching courtId from HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", "Error while fetching courtId from HRMS");
        }
    }
}
