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

import java.util.Map;

@Component
@Slf4j
public class HearingUpdateConsumer {

    private final WarrantReissueService warrantReissueService;
    private final ObjectMapper objectMapper;

    @Autowired
    public HearingUpdateConsumer(WarrantReissueService warrantReissueService, ObjectMapper objectMapper) {
        this.warrantReissueService = warrantReissueService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"${kafka.topics.hearing.update}"})
    public void listen(Map<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received hearing update on topic: {}", topic);
            JsonNode payload = objectMapper.convertValue(record, JsonNode.class);

            // Expected structure: { "RequestInfo": { ... }, "hearing": { ... } }
            JsonNode hearingNode = payload.get("hearing");
            if (hearingNode != null && !hearingNode.isNull()) {
                JsonNode workflow = hearingNode.get("workflow");
                if (workflow != null && !workflow.isNull() && workflow.has("action")) {
                    String action = workflow.get("action").asText();

                    // Trigger on UPDATE_DATE or RESCHEDULE_ONGOING
                    if ("UPDATE_DATE".equalsIgnoreCase(action) || "RESCHEDULE_ONGOING".equalsIgnoreCase(action)) {
                        RequestInfo requestInfo = objectMapper.convertValue(payload.get("RequestInfo"), RequestInfo.class);
                        String filingNumber = null;
                        if (hearingNode.has("filingNumber") && hearingNode.get("filingNumber").isArray() && hearingNode.get("filingNumber").size() > 0) {
                            filingNumber = hearingNode.get("filingNumber").get(0).asText();
                        } else if (hearingNode.has("filingNumber") && hearingNode.get("filingNumber").isTextual()) {
                            filingNumber = hearingNode.get("filingNumber").asText();
                        }

                        Long startTime = hearingNode.has("startTime") ? hearingNode.get("startTime").asLong() : null;
                        String orderId = null;
                        if (hearingNode.has("additionalDetails") && !hearingNode.get("additionalDetails").isNull()) {
                            JsonNode additionalDetails = hearingNode.get("additionalDetails");
                            if (additionalDetails.has("orderId") && !additionalDetails.get("orderId").isNull()) {
                                orderId = additionalDetails.get("orderId").asText();
                            }
                        }

                        if (filingNumber != null) {
                            warrantReissueService.handleHearingRescheduled(requestInfo, filingNumber, startTime, orderId);
                        } else {
                            log.warn("filingNumber not found in hearing update payload");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in HearingUpdateConsumer: ", e);
        }
    }

    @KafkaListener(topics = {"${bulk.reschedule.topic}"})
    public void listenBulkReschedule(Map<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received bulk hearing reschedule on topic: {}", topic);
            JsonNode payload = objectMapper.convertValue(record, JsonNode.class);

            // Expected structure: { "RequestInfo": { ... }, "hearings": [ ... ] }
            JsonNode hearingsNode = payload.get("hearings");
            if (hearingsNode != null && hearingsNode.isArray()) {
                RequestInfo requestInfo = objectMapper.convertValue(payload.get("RequestInfo"), RequestInfo.class);

                for (JsonNode hearingNode : hearingsNode) {
                    // Extract filingNumber
                    String filingNumber = null;
                    if (hearingNode.has("filingNumber") && hearingNode.get("filingNumber").isArray() && hearingNode.get("filingNumber").size() > 0) {
                        filingNumber = hearingNode.get("filingNumber").get(0).asText();
                    } else if (hearingNode.has("filingNumber") && hearingNode.get("filingNumber").isTextual()) {
                        filingNumber = hearingNode.get("filingNumber").asText();
                    }

                    Long startTime = hearingNode.has("startTime") ? hearingNode.get("startTime").asLong() : null;
                    String orderId = null;
                    if (hearingNode.has("additionalDetails") && !hearingNode.get("additionalDetails").isNull()) {
                        JsonNode additionalDetails = hearingNode.get("additionalDetails");
                        if (additionalDetails.has("orderId") && !additionalDetails.get("orderId").isNull()) {
                            orderId = additionalDetails.get("orderId").asText();
                        }
                    }

                    if (filingNumber != null) {
                        warrantReissueService.handleHearingRescheduled(requestInfo, filingNumber, startTime, orderId);
                    } else {
                        log.warn("filingNumber not found in bulk hearing update payload for hearingId: {}",
                                hearingNode.has("hearingId") ? hearingNode.get("hearingId").asText() : "unknown");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in HearingBulkRescheduleConsumer: ", e);
        }
    }
}
