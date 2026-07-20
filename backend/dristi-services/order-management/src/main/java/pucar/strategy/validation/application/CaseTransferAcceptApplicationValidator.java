package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.CASE_TRANSFER_ACCEPT;

@Component
public class CaseTransferAcceptApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public CaseTransferAcceptApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return CASE_TRANSFER_ACCEPT.equalsIgnoreCase(orderType);
    }
}