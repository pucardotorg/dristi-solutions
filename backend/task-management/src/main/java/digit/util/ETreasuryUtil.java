package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.web.models.DemandCreateRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static digit.config.ServiceConstants.ERROR_WHILE_CREATING_DEMAND_FOR_TASK_MANAGEMENT;

@Component
@Slf4j
public class ETreasuryUtil {

    private final Configuration configs;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public ETreasuryUtil(Configuration configs, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.configs = configs;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public void createDemand(DemandCreateRequest demandCreateRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getEtreasuryHost()).append(configs.getEtreasuryDemandCreateEndPoint());
        log.info("Demand create request :: {}", demandCreateRequest);
        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), demandCreateRequest, Map.class);
            log.info("Demand create response :: {}", response);
        } catch (Exception e) {
            log.error(ERROR_WHILE_CREATING_DEMAND_FOR_TASK_MANAGEMENT, e);
            throw new CustomException(ERROR_WHILE_CREATING_DEMAND_FOR_TASK_MANAGEMENT, e.getMessage());
        }
    }

    public JsonNode getPaymentReceipt(@Valid RequestInfo requestInfo, String id) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getEtreasuryHost()).append(configs.getTreasuryPaymentReceiptEndPoint())
                .append("?billId=").append(id);

        log.info("Payment Receipt uri :: {}", uri);
        Object response = null;
        try {
            response = restTemplate.postForObject(uri.toString(), requestInfo, Object.class);
            log.info("Payment Receipt response :: {}", response);
            return objectMapper.convertValue(response, JsonNode.class);
        } catch (Exception e) {
            log.error("Error while fetching payment receipt", e);
            throw new CustomException("Error while fetching payment receipt", e.getMessage());
        }
    }

}
