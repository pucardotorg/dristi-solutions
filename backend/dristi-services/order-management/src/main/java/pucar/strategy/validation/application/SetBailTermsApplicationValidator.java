package pucar.strategy.validation.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.OrderUtil;

import static pucar.config.ServiceConstants.SET_BAIL_TERMS;

@Component
public class SetBailTermsApplicationValidator extends AbstractApplicationValidator {

    @Autowired
    public SetBailTermsApplicationValidator(OrderUtil orderUtil) {
        super(orderUtil);
    }

    @Override
    public boolean supports(String orderType) {
        return SET_BAIL_TERMS.equalsIgnoreCase(orderType);
    }
}