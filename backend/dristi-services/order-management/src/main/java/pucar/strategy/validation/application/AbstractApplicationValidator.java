package pucar.strategy.validation.application;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import pucar.strategy.validation.OrderSignValidator;
import pucar.util.OrderUtil;
import pucar.web.models.Order;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static pucar.config.ServiceConstants.E_SIGN;

/**
 * Shared {@code refApplicationId} presence check reused by every order-type-specific validator.
 * Subclasses only need to declare which order type they apply to via {@link #supports(String)}.
 *
 * <p>Reuses the {@link OrderSignValidator} contract so these validators are picked up both by
 * {@code OrderSignValidationService} (bulk pre-sign check) and by {@code ApplicationValidationService}
 * (order create/update flow), instead of introducing a separate validator interface.
 */
@Slf4j
public abstract class AbstractApplicationValidator implements OrderSignValidator {

    protected final OrderUtil orderUtil;

    protected AbstractApplicationValidator(OrderUtil orderUtil) {
        this.orderUtil = orderUtil;
    }

    public abstract boolean supports(String orderType);

    @Override
    public void validate(RequestInfo requestInfo, List<Order> orders) {
        Set<String> invalidOrderTypes = new LinkedHashSet<>();
        for (Order order : orders) {
            if (!supports(order.getOrderType()) || !isEsignAction(order)) {
                continue;
            }

            String refApplicationId = orderUtil.getReferenceId(order);
            if (refApplicationId == null || refApplicationId.isBlank()) {
                log.error("refApplicationId is required in additionalDetails.formdata for orderNumber :: {}, filingNumber :: {}", order.getOrderNumber(), order.getFilingNumber());
                invalidOrderTypes.add(order.getOrderType());
            }
        }

        if (!invalidOrderTypes.isEmpty()) {
            String orderTypes = String.join(", ", invalidOrderTypes);
            throw new CustomException("REF_APPLICATION_ID_NOT_FOUND", "Please remove the " + orderTypes + " item(s) and add again");
        }
    }

    private boolean isEsignAction(Order order) {
        String action = order.getWorkflow() != null ? order.getWorkflow().getAction() : null;
        return E_SIGN.equalsIgnoreCase(action);
    }
}
