package pucar.strategy.validation;

import pucar.web.models.Order;

/**
 * Strategy contract for order-type-specific validation of an order's linked application
 * (e.g. presence of {@code refApplicationId} in {@code additionalDetails.formdata}) before it is e-signed.
 *
 * <p>New order types can require this validation simply by creating a new {@code @Component}
 * implementing this interface; {@code ApplicationValidationService} will pick it up and run it
 * automatically for orders whose type it supports.
 */
public interface ApplicationValidator {

    /**
     * @param orderType the order's {@code orderType}
     * @return true if this validator applies to the given order type
     */
    boolean supports(String orderType);

    /**
     * Validates the given order, throwing a CustomException if this validator's constraint is violated.
     *
     * @param order the order to validate
     */
    void validate(Order order);
}