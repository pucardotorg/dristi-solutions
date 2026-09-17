package pucar.strategy.validation;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.service.CompositeOrderService;
import pucar.util.HearingUtil;
import pucar.web.models.Order;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingSearchRequest;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static pucar.config.ServiceConstants.*;

/**
 * Validates that none of the orders selected for (bulk) signing will create a new hearing for a case
 * that already has a hearing in SCHEDULED status. Orders that create a new hearing
 * (SCHEDULE_OF_HEARING_DATE / SCHEDULING_NEXT_HEARING, including such items inside a composite order)
 * cannot be published if the case already has a scheduled hearing.
 */
@Slf4j
@Component
public class ScheduledHearingSignValidator implements OrderSignValidator {

    private final HearingUtil hearingUtil;
    private final CompositeOrderService compositeOrderService;

    @Autowired
    public ScheduledHearingSignValidator(HearingUtil hearingUtil, CompositeOrderService compositeOrderService) {
        this.hearingUtil = hearingUtil;
        this.compositeOrderService = compositeOrderService;
    }

    @Override
    public void validate(RequestInfo requestInfo, List<Order> orders) {
        Set<String> conflictingFilingNumbers = new LinkedHashSet<>();
        for (Order order : orders) {
            if (!createsHearing(order)) {
                continue;
            }

            if (hasScheduledHearing(requestInfo, order)) {
                log.error("Hearing already scheduled for case with filingNumber:{}, orderNumber:{}", order.getFilingNumber(), order.getOrderNumber());
                conflictingFilingNumbers.add(order.getFilingNumber());
            }
        }

        if (!conflictingFilingNumbers.isEmpty()) {
            String filingNumbers = String.join(", ", conflictingFilingNumbers);
            throw new CustomException(HEARING_ALREADY_SCHEDULED_ERROR, "A hearing is already scheduled for the following case(s): " + filingNumbers);
        }
    }

    private boolean createsHearing(Order order) {
        // An order carrying a nextHearingDate schedules a follow-up hearing on sign
        // (BSSService.updateOrderWithSignDoc -> HearingUtil.preProcessScheduleNextHearing).
        if (order.getNextHearingDate() != null) {
            return true;
        }
        if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
            return compositeOrderService.getItemListFormCompositeItem(order).stream()
                    .anyMatch(item -> isHearingCreatingOrderType(item.getOrderType()));
        }
        return isHearingCreatingOrderType(order.getOrderType());
    }

    private boolean isHearingCreatingOrderType(String orderType) {
        return SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(orderType) || SCHEDULING_NEXT_HEARING.equalsIgnoreCase(orderType);
    }

    private boolean hasScheduledHearing(RequestInfo requestInfo, Order order) {
        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(HearingCriteria.builder()
                        .filingNumber(order.getFilingNumber())
                        .tenantId(order.getTenantId()).build())
                .build());

        return Optional.ofNullable(hearings).orElse(Collections.emptyList()).stream()
                .anyMatch(hearing -> SCHEDULED.equalsIgnoreCase(hearing.getStatus()));
    }
}
