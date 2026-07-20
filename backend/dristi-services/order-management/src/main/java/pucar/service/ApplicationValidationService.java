package pucar.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pucar.strategy.validation.ApplicationValidator;
import pucar.web.models.Order;

import java.util.List;

import static pucar.config.ServiceConstants.E_SIGN;

/**
 * Runs the {@link ApplicationValidator} strategy that supports the given order's type, if any.
 * Adding validation for a new order type only requires a new {@code ApplicationValidator} bean.
 */
@Service
@RequiredArgsConstructor
public class ApplicationValidationService {

    private final List<ApplicationValidator> validators;

    public void validate(Order order) {
        String action = order.getWorkflow() != null ? order.getWorkflow().getAction() : null;
        if (!E_SIGN.equalsIgnoreCase(action)) {
            return;
        }

        validators.stream()
                .filter(validator -> validator.supports(order.getOrderType()))
                .forEach(validator -> validator.validate(order));
    }
}