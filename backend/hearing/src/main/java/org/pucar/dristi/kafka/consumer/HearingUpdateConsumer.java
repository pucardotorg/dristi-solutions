package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.models.Workflow;
import org.pucar.dristi.service.HearingService;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.HearingRequest;
import org.pucar.dristi.web.models.WorkflowObject;
import org.pucar.dristi.web.models.orders.*;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class HearingUpdateConsumer {

    private final HearingService hearingService;
    private final ObjectMapper objectMapper;

    private final OrderUtil orderUtil;

    public HearingUpdateConsumer(HearingService hearingService, ObjectMapper objectMapper, OrderUtil orderUtil) {
        this.hearingService = hearingService;
        this.objectMapper = objectMapper;
        this.orderUtil = orderUtil;
    }

    @KafkaListener(topics = {"${hearing.case.reference.number.update}","${lpr.case.details.update.kafka.topic}"})
    public void updateCaseReferenceConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received case reference number details on topic: {}", topic);
            hearingService.updateCaseReferenceHearing(objectMapper.convertValue(payload.value(), Map.class));
            log.info("Updated case reference number for hearings");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to case reference number details topic: {}: {}", topic, e.getMessage());
        }

    }

    @KafkaListener(topics = {"${kafka.topics.hearing.update}"})
    public void updateHearingConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received hearing details on topic: {}", topic);
            HearingRequest hearingRequest = objectMapper.convertValue(payload.value(), HearingRequest.class);
            String hearingStatus = hearingRequest.getHearing().getStatus();
            if (hearingStatus.equalsIgnoreCase(COMPLETED) || hearingStatus.equalsIgnoreCase(ABANDONED)) {
                orderUtil.closeActivePaymentPendingTasks(hearingRequest);
            }
            if (hearingStatus.equalsIgnoreCase(COMPLETED)) {
                OrderCriteria criteria = OrderCriteria.builder()
                        .hearingNumber(hearingRequest.getHearing().getHearingId())
                        .status("DRAFT_IN_PROGRESS")
                        .orderType("SCHEDULING_NEXT_HEARING")
                        .tenantId(hearingRequest.getHearing().getTenantId())
                        .build();

                OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                        .criteria(criteria)
                        .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                        .build();

                OrderListResponse response = orderUtil.getOrders(searchRequest);
                if (response == null || CollectionUtils.isEmpty(response.getList())) {
                    log.info("No SCHEDULING_NEXT_HEARING in DRAFT state found for Hearing ID: {}", hearingRequest.getHearing().getHearingId());
                    return;
                }
                else{
                    org.pucar.dristi.web.models.orders.Order order = Order.builder()
                            .hearingNumber(hearingRequest.getHearing().getHearingId())
                            .filingNumber(
                                    hearingRequest.getHearing().getFilingNumber() != null && !hearingRequest.getHearing().getFilingNumber().isEmpty()
                                            ? hearingRequest.getHearing().getFilingNumber().get(0)
                                            : null
                            )
                            .cnrNumber(
                                    hearingRequest.getHearing().getCnrNumbers() != null && !hearingRequest.getHearing().getCnrNumbers().isEmpty()
                                            ? hearingRequest.getHearing().getCnrNumbers().get(0)
                                            : null
                            )
                            .tenantId(hearingRequest.getHearing().getTenantId())
                            .orderTitle("SCHEDULING_NEXT_HEARING")
                            .orderType("SCHEDULING_NEXT_HEARING")
                            .orderCategory("INTERMEDIATE")
                            .statuteSection(StatuteSection.builder().tenantId(hearingRequest.getHearing().getTenantId()).build())
                            .build();

                    WorkflowObject workflow = new WorkflowObject();
                    workflow.setAction("SAVE_DRAFT");
                    order.setWorkflow(workflow);

                    OrderRequest orderRequest = OrderRequest.builder()
                            .requestInfo(hearingRequest.getRequestInfo()).order(order).build();
                     OrderResponse orderResponse = orderUtil.createOrder(orderRequest);
                    log.info("Order created for Hearing ID: {}, orderNumber:: {}", hearingRequest.getHearing().getHearingId(), orderResponse.getOrder().getOrderNumber());
                }
            }
            log.info("Updated hearings");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to hearings topic: {}: {}", topic, e.getMessage());
        }
    }
}
