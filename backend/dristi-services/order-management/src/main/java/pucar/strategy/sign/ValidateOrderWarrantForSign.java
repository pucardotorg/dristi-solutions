package pucar.strategy.sign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.util.JsonUtil;
import pucar.web.models.Order;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.WARRANT;

@Component
@Slf4j
@RequiredArgsConstructor
public class ValidateOrderWarrantForSign implements OrderSignValidationStrategy {

    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(Order order) {
        return WARRANT.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public List<String> validate(Order order, RequestInfo requestInfo) {
        log.info("Validating order for sign, orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());
        List<String> errors = new ArrayList<>();

        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        if (taskDetails == null || taskDetails.isBlank()) {
            errors.add("taskDetails is missing in additionalDetails");
            return errors;
        }

        try {
            JsonNode taskArray = objectMapper.readTree(taskDetails);
            if (!taskArray.isArray() || taskArray.isEmpty()) {
                errors.add("taskDetails must be a non-empty JSON array");
                return errors;
            }
            for (int i = 0; i < taskArray.size(); i++) {
                if (taskArray.get(i).path("respondentDetails").isMissingNode()) {
                    errors.add("taskDetails[" + i + "] is missing respondentDetails");
                }
            }
        } catch (Exception e) {
            errors.add("taskDetails is not valid JSON: " + e.getMessage());
        }

        return errors;
    }
}
