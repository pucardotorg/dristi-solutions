package pucar.service;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import pucar.strategy.validation.application.AssigningDateRescheduledHearingApplicationValidator;
import pucar.strategy.validation.application.CheckoutAcceptanceApplicationValidator;
import pucar.strategy.validation.application.InitiatingReschedulingOfHearingDateApplicationValidator;
import pucar.strategy.validation.application.RescheduleOfHearingDateApplicationValidator;
import pucar.strategy.validation.application.SetBailTermsApplicationValidator;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.WorkflowObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static pucar.config.ServiceConstants.CHECKOUT_ACCEPTANCE;
import static pucar.config.ServiceConstants.E_SIGN;
import static pucar.config.ServiceConstants.SET_BAIL_TERMS;

class ApplicationValidationServiceTest {

    // getReferenceId only reads Order.additionalDetails, so the collaborator dependencies are irrelevant here.
    private final OrderUtil orderUtil = new OrderUtil(null, null, null, null, null);

    private ApplicationValidationService service(OrderUtil orderUtil) {
        return new ApplicationValidationService(List.of(
                new SetBailTermsApplicationValidator(orderUtil),
                new RescheduleOfHearingDateApplicationValidator(orderUtil),
                new CheckoutAcceptanceApplicationValidator(orderUtil),
                new AssigningDateRescheduledHearingApplicationValidator(orderUtil),
                new InitiatingReschedulingOfHearingDateApplicationValidator(orderUtil)
        ));
    }

    private Order buildOrder(String orderType, String action, String refApplicationId) {
        WorkflowObject workflow = null;
        if (action != null) {
            workflow = new WorkflowObject();
            workflow.setAction(action);
        }

        Object additionalDetails = null;
        if (refApplicationId != null) {
            Map<String, Object> formdata = new HashMap<>();
            formdata.put("refApplicationId", refApplicationId);
            Map<String, Object> details = new HashMap<>();
            details.put("formdata", formdata);
            additionalDetails = details;
        }

        return Order.builder()
                .orderType(orderType)
                .workflow(workflow)
                .additionalDetails(additionalDetails)
                .build();
    }

    @Test
    void doesNotThrowWhenRefApplicationIdPresentForSupportedOrderType() {
        Order order = buildOrder(SET_BAIL_TERMS, E_SIGN, "APP-123");
        assertDoesNotThrow(() -> service(orderUtil).validate(order));
    }

    @Test
    void throwsWhenRefApplicationIdMissingForSupportedOrderType() {
        Order order = buildOrder(CHECKOUT_ACCEPTANCE, E_SIGN, null);

        CustomException exception = assertThrows(CustomException.class, () -> service(orderUtil).validate(order));
        assertEquals("REF_APPLICATION_ID_NOT_FOUND", exception.getCode());
        assertTrue(exception.getMessage().contains(CHECKOUT_ACCEPTANCE));
    }

    @Test
    void throwsWhenRefApplicationIdBlank() {
        Order order = buildOrder(SET_BAIL_TERMS, E_SIGN, "   ");

        CustomException exception = assertThrows(CustomException.class, () -> service(orderUtil).validate(order));
        assertEquals("REF_APPLICATION_ID_NOT_FOUND", exception.getCode());
    }

    @Test
    void doesNotThrowForOrderTypeWithoutRegisteredValidator() {
        Order order = buildOrder("OTHER_ORDER_TYPE", E_SIGN, null);
        assertDoesNotThrow(() -> service(orderUtil).validate(order));
    }

    @Test
    void doesNotThrowForNonEsignAction() {
        Order order = buildOrder(SET_BAIL_TERMS, "SAVE_DRAFT", null);
        assertDoesNotThrow(() -> service(orderUtil).validate(order));
    }

    @Test
    void doesNotThrowWhenWorkflowNull() {
        Order order = buildOrder(SET_BAIL_TERMS, null, null);
        assertDoesNotThrow(() -> service(orderUtil).validate(order));
    }
}