package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.ACCEPTANCE_REJECTION_DCA;

@Component
public class AcceptanceRejectionDcaApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public AcceptanceRejectionDcaApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return ACCEPTANCE_REJECTION_DCA.equalsIgnoreCase(orderType);
    }
}