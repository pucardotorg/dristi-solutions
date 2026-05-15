package org.pucar.dristi.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.service.WarrantReissueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import org.pucar.dristi.web.models.BulkHearingRequest;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.HearingRequest;
import org.pucar.dristi.util.OrderUtil;

import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.RESCHEDULE_ONGOING;
import static org.pucar.dristi.config.ServiceConstants.SCHEDULED;
import static org.pucar.dristi.config.ServiceConstants.UPDATE_DATE;

@Component
@Slf4j
public class HearingUpdateConsumer {

    private final WarrantReissueService warrantReissueService;
    private final ObjectMapper objectMapper;
    private final OrderUtil orderUtil;

    @Autowired
    public HearingUpdateConsumer(WarrantReissueService warrantReissueService, ObjectMapper objectMapper,
            OrderUtil orderUtil) {
        this.warrantReissueService = warrantReissueService;
        this.objectMapper = objectMapper;
        this.orderUtil = orderUtil;
    }

    // Listens to hearing updates to trigger in-place warrant reschedule (Scenario
    // 1) or warrant reissue (Scenario 2)
    @KafkaListener(topics = {
            "${kafka.topics.hearing.update}",
            "${kafka.topics.hearing.create}",
            "${update.start.end.time.topic}"
    })
    public void listen(Map<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received hearing update on topic: {}", topic);
            HearingRequest payload = objectMapper.convertValue(record, HearingRequest.class);

            Hearing hearing = payload.getHearing();
            if (hearing != null) {
                RequestInfo requestInfo = payload.getRequestInfo();
                String filingNumber = null;
                if (hearing.getFilingNumber() != null && !hearing.getFilingNumber().isEmpty()) {
                    filingNumber = hearing.getFilingNumber().get(0);
                }

                Long startTime = hearing.getStartTime();
                String orderId = orderUtil.getOrderIdByHearingId(requestInfo, hearing.getHearingId(),
                        hearing.getTenantId());

                String status = hearing.getStatus() != null ? hearing.getStatus() : "";
                if (SCHEDULED.equalsIgnoreCase(status)) {
                    if (filingNumber != null) {
                        warrantReissueService.handleHearingCompletedAndNewHearingScheduled(requestInfo, filingNumber,
                                startTime, orderId);
                    } else {
                        log.warn("filingNumber not found in hearing update payload for scenario 2");
                    }
                }

                if (hearing.getWorkflow() != null && hearing.getWorkflow().getAction() != null) {
                    String action = hearing.getWorkflow().getAction();

                    // Trigger on UPDATE_DATE or RESCHEDULE_ONGOING
                    if (UPDATE_DATE.equalsIgnoreCase(action) || RESCHEDULE_ONGOING.equalsIgnoreCase(action)) {
                        if (filingNumber != null) {
                            warrantReissueService.handleHearingRescheduled(requestInfo, filingNumber, startTime,
                                    orderId);
                        } else {
                            log.warn("filingNumber not found in hearing update payload for scenario 1");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in HearingUpdateConsumer: ", e);
        }
    }

    @KafkaListener(topics = { "${bulk.reschedule.topic}" })
    public void listenBulkReschedule(Map<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received bulk hearing reschedule on topic: {}", topic);
            BulkHearingRequest payload = objectMapper.convertValue(record, BulkHearingRequest.class);

            if (payload.getHearings() != null && !payload.getHearings().isEmpty()) {
                RequestInfo requestInfo = payload.getRequestInfo();

                for (Hearing hearing : payload.getHearings()) {
                    String filingNumber = null;
                    if (hearing.getFilingNumber() != null && !hearing.getFilingNumber().isEmpty()) {
                        filingNumber = hearing.getFilingNumber().get(0);
                    }

                    Long startTime = hearing.getStartTime();
                    String orderId = orderUtil.getOrderIdByHearingId(requestInfo, hearing.getHearingId(),
                            hearing.getTenantId());

                    if (filingNumber != null) {
                        warrantReissueService.handleHearingRescheduled(requestInfo, filingNumber, startTime, orderId);
                    } else {
                        log.warn("filingNumber not found in bulk hearing update payload for hearingId: {}",
                                hearing.getHearingId() != null ? hearing.getHearingId() : "unknown");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in HearingBulkRescheduleConsumer: ", e);
        }
    }
}
