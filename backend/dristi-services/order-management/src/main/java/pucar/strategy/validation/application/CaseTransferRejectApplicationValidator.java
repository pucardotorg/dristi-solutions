package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.CASE_TRANSFER_REJECT;

@Component
public class CaseTransferRejectApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public CaseTransferRejectApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return CASE_TRANSFER_REJECT.equalsIgnoreCase(orderType);
    }
}