package pucar.strategy.sign;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.web.models.Order;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.SCHEDULE_OF_HEARING_DATE;

@Component
@Slf4j
public class ValidateOrderScheduleHearingForSign implements OrderSignValidationStrategy {

    @Override
    public boolean supports(Order order) {
        return SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public List<String> validate(Order order, RequestInfo requestInfo) {
        log.info("Validating order for sign, orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());
        List<String> errors = new ArrayList<>();

        if (order.getHearingNumber() == null || order.getHearingNumber().isBlank()) {
            errors.add("hearingNumber is required for SCHEDULE_OF_HEARING_DATE order");
        }
        if (order.getFilingNumber() == null || order.getFilingNumber().isBlank()) {
            errors.add("filingNumber is required for SCHEDULE_OF_HEARING_DATE order");
        }

        return errors;
    }
}
