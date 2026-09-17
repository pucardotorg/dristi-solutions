package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.REJECT_VOLUNTARY_SUBMISSIONS;

@Component
public class RejectVoluntarySubmissionsApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public RejectVoluntarySubmissionsApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return REJECT_VOLUNTARY_SUBMISSIONS.equalsIgnoreCase(orderType);
    }
}