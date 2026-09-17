package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.RESCHEDULE_OF_HEARING_DATE;

@Component
public class RescheduleOfHearingDateApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public RescheduleOfHearingDateApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return RESCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(orderType);
    }
}