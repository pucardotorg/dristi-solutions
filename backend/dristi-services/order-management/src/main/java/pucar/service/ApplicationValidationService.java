package pucar.service;

import lombok.RequiredArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;
import pucar.strategy.validation.application.AbstractApplicationValidator;
import pucar.web.models.Order;

import java.util.List;

/**
 * Runs every {@link AbstractApplicationValidator} bean (one per order type) against a single order
 * during order create/update. Each validator decides internally whether it applies via
 * {@code supports(orderType)}, so adding validation for a new order type only requires a new bean.
 *
 * <p>These same beans are also picked up by {@code OrderSignValidationService}, since they implement
 * the shared {@code OrderSignValidator} contract.
 */
@Service
@RequiredArgsConstructor
public class ApplicationValidationService {

    private final List<AbstractApplicationValidator> validators;

    public void validate(RequestInfo requestInfo, Order order) {
        validators.forEach(validator -> validator.validate(requestInfo, List.of(order)));
    }
}
