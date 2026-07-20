package pucar.strategy.validation.application;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import pucar.strategy.validation.ApplicationValidator;
import pucar.util.OrderUtil;
import pucar.web.models.Order;

/**
 * Shared {@code refApplicationId} presence check reused by every order-type-specific validator.
 * Subclasses only need to declare which order type they apply to via {@link #supports(String)}.
 */
@Slf4j
public abstract class AbstractApplicationValidator implements ApplicationValidator {

    protected final OrderUtil orderUtil;

    protected AbstractApplicationValidator(OrderUtil orderUtil) {
        this.orderUtil = orderUtil;
    }

    @Override
    public void validate(Order order) {
        String refApplicationId = orderUtil.getReferenceId(order);
        if (refApplicationId == null || refApplicationId.isBlank()) {
            log.error("refApplicationId is required in additionalDetails.formdata for orderNumber :: {}, filingNumber :: {}", order.getOrderNumber(), order.getFilingNumber());
            throw new CustomException("REF_APPLICATION_ID_NOT_FOUND", "Please remove the " + order.getOrderType() + " item and add again");
        }
    }
}