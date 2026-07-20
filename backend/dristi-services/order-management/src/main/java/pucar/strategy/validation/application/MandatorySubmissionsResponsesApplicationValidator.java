package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.MANDATORY_SUBMISSIONS_RESPONSES;

@Component
public class MandatorySubmissionsResponsesApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public MandatorySubmissionsResponsesApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return MANDATORY_SUBMISSIONS_RESPONSES.equalsIgnoreCase(orderType);
    }
}