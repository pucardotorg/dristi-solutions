package digit.util;

import digit.config.Configuration;
import digit.web.models.DemandCreateRequest;
import lombok.extern.slf4j.Slf4j;
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

    @Autowired
    public ETreasuryUtil(Configuration configs, RestTemplate restTemplate) {
        this.configs = configs;
        this.restTemplate = restTemplate;
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

}
