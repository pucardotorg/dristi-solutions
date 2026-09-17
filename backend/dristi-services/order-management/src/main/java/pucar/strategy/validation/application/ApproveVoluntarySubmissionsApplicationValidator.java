package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.APPROVE_VOLUNTARY_SUBMISSIONS;

@Component
public class ApproveVoluntarySubmissionsApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public ApproveVoluntarySubmissionsApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return APPROVE_VOLUNTARY_SUBMISSIONS.equalsIgnoreCase(orderType);
    }
}