package pucar.strategy.sign;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.util.JsonUtil;
import pucar.web.models.Order;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.SUMMONS;

@Component
@Slf4j
@RequiredArgsConstructor
public class ValidateOrderSummonsForSign implements OrderSignValidationStrategy {

    private final JsonUtil jsonUtil;

    @Override
    public boolean supports(Order order) {
        return SUMMONS.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public List<String> validate(Order order, RequestInfo requestInfo) {
        log.info("Validating order for sign, orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());
        List<String> errors = new ArrayList<>();

        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        if (taskDetails == null || taskDetails.isBlank()) {
            errors.add("taskDetails is missing in additionalDetails");
        }

        List<?> party = jsonUtil.getNestedValue(order.getAdditionalDetails(),
                List.of("formdata", "SummonsOrder", "party"), List.class);
        if (party == null || party.isEmpty()) {
            errors.add("SummonsOrder.party is missing or empty in additionalDetails");
        }

        return errors;
    }
}
