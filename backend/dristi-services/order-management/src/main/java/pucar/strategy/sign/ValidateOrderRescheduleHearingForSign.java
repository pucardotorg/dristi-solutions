package pucar.strategy.sign;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.web.models.Order;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.RESCHEDULE_OF_HEARING_DATE;

@Component
@Slf4j
public class ValidateOrderRescheduleHearingForSign implements OrderSignValidationStrategy {

    @Override
    public boolean supports(Order order) {
        return RESCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public List<String> validate(Order order, RequestInfo requestInfo) {
        log.info("Validating order for sign, orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());
        List<String> errors = new ArrayList<>();

        if (order.getHearingNumber() == null || order.getHearingNumber().isBlank()) {
            errors.add("hearingNumber is required for RESCHEDULE_OF_HEARING_DATE order");
        }

        return errors;
    }
}
