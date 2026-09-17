package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.ACCEPT_RESCHEDULING_REQUEST;

@Component
public class AcceptReschedulingRequestApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public AcceptReschedulingRequestApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return ACCEPT_RESCHEDULING_REQUEST.equalsIgnoreCase(orderType);
    }
}