package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.INITIATING_RESCHEDULING_OF_HEARING_DATE;

@Component
public class InitiatingReschedulingOfHearingDateApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public InitiatingReschedulingOfHearingDateApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return INITIATING_RESCHEDULING_OF_HEARING_DATE.equalsIgnoreCase(orderType);
    }
}