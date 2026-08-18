package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.CHECKOUT_ACCEPTANCE;

@Component
public class CheckoutAcceptanceApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public CheckoutAcceptanceApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return CHECKOUT_ACCEPTANCE.equalsIgnoreCase(orderType);
    }
}