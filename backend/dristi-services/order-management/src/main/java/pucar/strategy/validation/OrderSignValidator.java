package pucar.strategy.validation;

import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.Order;

import java.util.List;

/**
 * Strategy contract for pre-sign validations applied to the set of orders selected for (bulk) signing.
 * Each implementation inspects the orders and throws a {@link org.egov.tracer.model.CustomException}
 * when a constraint is violated, so the user is informed before the orders are signed/published.
 *
 * <p>New pre-sign rules can be added simply by creating a new {@code @Component} implementing this
 * interface; {@code OrderSignValidationService} will pick it up and run it automatically.
 */
public interface OrderSignValidator {

    /**
     * Validates the given orders, throwing a CustomException if this validator's constraint is violated.
     *
     * @param requestInfo request info of the sign request
     * @param orders      orders selected for signing (already fetched)
     */
    void validate(RequestInfo requestInfo, List<Order> orders);
}
