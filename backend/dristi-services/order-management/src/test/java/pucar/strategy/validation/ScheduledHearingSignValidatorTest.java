package pucar.strategy.validation;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.service.CompositeOrderService;
import pucar.util.HearingUtil;
import pucar.web.models.Order;
import pucar.web.models.hearing.Hearing;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static pucar.config.ServiceConstants.COMPOSITE;
import static pucar.config.ServiceConstants.SCHEDULED;
import static pucar.config.ServiceConstants.SCHEDULE_OF_HEARING_DATE;

@ExtendWith(MockitoExtension.class)
class ScheduledHearingSignValidatorTest {

    @Mock
    private HearingUtil hearingUtil;

    @Mock
    private CompositeOrderService compositeOrderService;

    @InjectMocks
    private ScheduledHearingSignValidator validator;

    private final RequestInfo requestInfo = new RequestInfo();

    private Order order(String orderType, String orderCategory) {
        return Order.builder()
                .orderNumber("ORD123")
                .tenantId("tenant1")
                .filingNumber("FIL123")
                .orderType(orderType)
                .orderCategory(orderCategory)
                .build();
    }

    private void scheduledHearingExists() {
        when(hearingUtil.fetchHearing(any())).thenReturn(Collections.singletonList(Hearing.builder().status(SCHEDULED).build()));
    }

    @Test
    void throwsWhenHearingCreatingOrderAndHearingAlreadyScheduled() {
        scheduledHearingExists();

        CustomException exception = assertThrows(CustomException.class,
                () -> validator.validate(requestInfo, List.of(order(SCHEDULE_OF_HEARING_DATE, "INTERMEDIATE"))));
        assertEquals("HEARING_ALREADY_SCHEDULED_ERROR", exception.getCode());
    }

    @Test
    void throwsWhenNextHearingDateOrderAndHearingAlreadyScheduled() {
        scheduledHearingExists();
        Order order = order("OTHER_ORDER", "INTERMEDIATE");
        order.setNextHearingDate(1234567890L);

        CustomException exception = assertThrows(CustomException.class,
                () -> validator.validate(requestInfo, List.of(order)));
        assertEquals("HEARING_ALREADY_SCHEDULED_ERROR", exception.getCode());
    }

    @Test
    void throwsWhenCompositeOrderContainsHearingCreatingItemAndHearingScheduled() {
        scheduledHearingExists();
        Order composite = order(null, COMPOSITE);
        when(compositeOrderService.getItemListFormCompositeItem(composite))
                .thenReturn(List.of(order(SCHEDULE_OF_HEARING_DATE, "INTERMEDIATE")));

        CustomException exception = assertThrows(CustomException.class,
                () -> validator.validate(requestInfo, List.of(composite)));
        assertEquals("HEARING_ALREADY_SCHEDULED_ERROR", exception.getCode());
    }

    @Test
    void aggregatesAllConflictingCasesInSingleError() {
        scheduledHearingExists();
        Order first = order(SCHEDULE_OF_HEARING_DATE, "INTERMEDIATE");
        first.setFilingNumber("FIL-A");
        Order second = order(SCHEDULE_OF_HEARING_DATE, "INTERMEDIATE");
        second.setFilingNumber("FIL-B");

        CustomException exception = assertThrows(CustomException.class,
                () -> validator.validate(requestInfo, List.of(first, second)));
        assertEquals("HEARING_ALREADY_SCHEDULED_ERROR", exception.getCode());
        assertEquals("A hearing is already scheduled for the following case(s): FIL-A, FIL-B", exception.getMessage());
    }

    @Test
    void doesNotThrowWhenNoScheduledHearingExists() {
        when(hearingUtil.fetchHearing(any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> validator.validate(requestInfo, List.of(order(SCHEDULE_OF_HEARING_DATE, "INTERMEDIATE"))));
    }

    @Test
    void doesNotThrowOrFetchHearingWhenOrderDoesNotCreateHearing() {
        assertDoesNotThrow(() -> validator.validate(requestInfo, List.of(order("OTHER_ORDER", "INTERMEDIATE"))));
        verify(hearingUtil, never()).fetchHearing(any());
    }
}
