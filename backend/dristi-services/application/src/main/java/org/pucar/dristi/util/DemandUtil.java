package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.BreakDown;
import org.pucar.dristi.web.models.Calculation;
import org.pucar.dristi.web.models.DemandCreateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Stream;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_CASE;
import static org.pucar.dristi.config.ServiceConstants.VALIDATION_ERR;

@Service
@Slf4j
public class DemandUtil {

    private final RestTemplate restTemplate;
    private final Configuration config;
    private final ObjectMapper objectMapper;
    private final BillingUtil billingUtil;

    @Autowired
    public DemandUtil(RestTemplate restTemplate, Configuration config, ObjectMapper objectMapper, BillingUtil billingUtil) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
        this.billingUtil = billingUtil;
    }

    public void createDemand(RequestInfo requestInfo, String tenantId, String entityType, String filingNumber, String consumerCode, Double totalAmount) {
        validateParamsForDemandCreate(requestInfo, tenantId, entityType, filingNumber, consumerCode, totalAmount);

        try {
            if (billingUtil.billExists(requestInfo, tenantId, consumerCode, entityType)) {
                log.info("Bill already exists for consumerCode: {}. Skipping demand creation.", consumerCode);
                return;
            }

            String uri = config.getEtreasuryHost() + config.getEtreasuryCreateDemandPath();

            DemandCreateRequest demandRequest = buildDemandRequest(requestInfo, tenantId, entityType, filingNumber, consumerCode, totalAmount);

            log.info("Creating demand for consumerCode: {}", consumerCode);
            restTemplate.postForEntity(uri, demandRequest, Object.class);
            log.info("Demand created successfully for consumerCode: {}", consumerCode);
        } catch (Exception e) {
            log.error("Error while creating demand for application: {}", e.getMessage(), e);
            throw new CustomException(ERROR_WHILE_CREATING_DEMAND_FOR_CASE, "Error while creating demand: " + e.getMessage());
        }
    }

    private DemandCreateRequest buildDemandRequest(RequestInfo requestInfo, String tenantId, String entityType, 
                                                    String filingNumber, String consumerCode, Double totalAmount) {
        BreakDown breakDownItem = BreakDown.builder()
                .type("Application Fee")
                .code("APPLICATION_FEE")
                .amount(totalAmount)
                .additionalParams(new HashMap<>())
                .build();

        List<BreakDown> breakDownList = new ArrayList<>();
        breakDownList.add(breakDownItem);

        Calculation calculation = Calculation.builder()
                .tenantId(tenantId)
                .totalAmount(totalAmount)
                .breakDown(breakDownList)
                .build();

        List<Calculation> calculations = new ArrayList<>();
        calculations.add(calculation);

        return DemandCreateRequest.builder()
                .requestInfo(requestInfo)
                .tenantId(tenantId)
                .entityType(entityType)
                .filingNumber(filingNumber)
                .consumerCode(consumerCode)
                .calculation(calculations)
                .build();
    }

    private void validateParamsForDemandCreate(RequestInfo requestInfo, String tenantId, String entityType,
                                               String filingNumber, String consumerCode, Double totalAmount) {
        
        boolean isRequestInvalid = Stream.of(tenantId, entityType, filingNumber, consumerCode)
                .anyMatch(param -> param == null || param.isBlank()) ||
                totalAmount == null || totalAmount <= 0D ||
                requestInfo == null;
        
        if (isRequestInvalid) {
            throw new CustomException(VALIDATION_ERR, "Invalid parameters for demand creation");
        }
    }
}
