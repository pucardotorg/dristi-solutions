package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.ASSIGNING_DATE_RESCHEDULED_HEARING;

@Component
public class AssigningDateRescheduledHearingApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public AssigningDateRescheduledHearingApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return ASSIGNING_DATE_RESCHEDULED_HEARING.equalsIgnoreCase(orderType);
    }
}