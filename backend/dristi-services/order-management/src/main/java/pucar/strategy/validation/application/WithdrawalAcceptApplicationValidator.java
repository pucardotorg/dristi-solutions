package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.WITHDRAWAL_ACCEPT;

@Component
public class WithdrawalAcceptApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public WithdrawalAcceptApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return WITHDRAWAL_ACCEPT.equalsIgnoreCase(orderType);
    }
}