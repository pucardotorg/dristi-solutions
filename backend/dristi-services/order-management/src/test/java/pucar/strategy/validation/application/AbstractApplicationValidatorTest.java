package pucar.strategy.validation.application;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.WorkflowObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static pucar.config.ServiceConstants.CHECKOUT_ACCEPTANCE;
import static pucar.config.ServiceConstants.E_SIGN;
import static pucar.config.ServiceConstants.SET_BAIL_TERMS;

class AbstractApplicationValidatorTest {

    // getReferenceId only reads Order.additionalDetails, so the collaborator dependencies are irrelevant here.
    private final OrderUtil orderUtil = new OrderUtil(null, null, null, null, null);
    private final SetBailTermsApplicationValidator validator = new SetBailTermsApplicationValidator(orderUtil);
    private final RequestInfo requestInfo = new RequestInfo();

    private Order order(String orderType, String action, String refApplicationId, String orderNumber) {
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
                .orderNumber(orderNumber)
                .orderType(orderType)
                .workflow(workflow)
                .additionalDetails(additionalDetails)
                .build();
    }

    @Test
    void aggregatesMissingRefApplicationIdAcrossOrdersIntoSingleException() {
        Order first = order(SET_BAIL_TERMS, E_SIGN, null, "ORD1");
        Order second = order(SET_BAIL_TERMS, E_SIGN, null, "ORD2");

        CustomException exception = assertThrows(CustomException.class,
                () -> validator.validate(requestInfo, List.of(first, second)));
        assertEquals("REF_APPLICATION_ID_NOT_FOUND", exception.getCode());
    }

    @Test
    void ignoresOrdersOfUnsupportedTypeWithinTheList() {
        Order supported = order(SET_BAIL_TERMS, E_SIGN, "APP-123", "ORD1");
        Order unsupported = order(CHECKOUT_ACCEPTANCE, E_SIGN, null, "ORD2");

        assertDoesNotThrow(() -> validator.validate(requestInfo, List.of(supported, unsupported)));
    }

    @Test
    void doesNotThrowWhenListIsEmpty() {
        assertDoesNotThrow(() -> validator.validate(requestInfo, List.of()));
    }
}
