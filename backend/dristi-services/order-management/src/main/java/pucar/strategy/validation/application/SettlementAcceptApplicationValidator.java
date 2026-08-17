package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.SETTLEMENT_ACCEPT;

@Component
public class SettlementAcceptApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public SettlementAcceptApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return SETTLEMENT_ACCEPT.equalsIgnoreCase(orderType);
    }
}