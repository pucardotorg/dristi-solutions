package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.WITHDRAWAL_REJECT;

@Component
public class WithdrawalRejectApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public WithdrawalRejectApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return WITHDRAWAL_REJECT.equalsIgnoreCase(orderType);
    }
}