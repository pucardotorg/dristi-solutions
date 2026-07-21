package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.SETTLEMENT_REJECT;

@Component
public class SettlementRejectApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public SettlementRejectApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return SETTLEMENT_REJECT.equalsIgnoreCase(orderType);
    }
}