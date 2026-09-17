package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.service.BillingService;
import org.pucar.dristi.service.IndexerService;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Objects;

@Service
@Slf4j
public class EventListener implements MessageListener<String, String> {

    @Autowired
    private IndexerService indexerService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private Configuration config;

    @Autowired
    private ObjectMapper objectMapper;


    @Override

    /**
     * Messages listener which acts as consumer. This message listener is injected
     * inside a kafkaContainer. This consumer is a start point to the following
     * index jobs: 1. Re-index 2. Legacy Index 3. PGR custom index 4. PT custom
     * index 5. Core indexing
     */
    public void onMessage(ConsumerRecord<String, String> data) {
        log.info("Topic from CoreIndexMessageListener: " + data.topic());
        MDC.put(ServiceConstants.TENANTID_MDC_STRING, config.getStateLevelTenantId());
        MDC.put(ServiceConstants.CORRELATION_ID, getCorrelationIdFromBody(data.value()));
        if (config.getDemandGenerateTopic().equals(data.topic())) {
            handleDemandGenerateTopic(data.value());
        } else if (config.getPaymentCollectTopic().equals(data.topic())) {
            handlePaymentCollectTopic(data.value());
        } else {
            handleOtherTopics(data.topic(), data.value());
        }
    }

    private void handleDemandGenerateTopic(String message) {
        try {
            billingService.process(config.getDemandGenerateTopic(), message);
        } catch (Exception e) {
            log.error("Error while processing demand generate topic: ", e);
        }
    }

    private void handlePaymentCollectTopic(String message) {
        try {
            billingService.process(config.getPaymentCollectTopic(), message);
        } catch (Exception e) {
            log.error("Error while processing payment collect topic: ", e);
        }
    }

    private void handleOtherTopics(String topic, String message) {
        try {
            indexerService.esIndexer(topic, message);
        } catch (Exception e) {
            log.error("Error while updating ES document: ", e);
        }
    }

    private String getCorrelationIdFromBody(Object value) {
        String correlationId = null;

        try {
            Map<String, Object> requestMap = (Map)objectMapper.readValue(value.toString(), Map.class);
            Object requestInfo = requestMap.containsKey("RequestInfo") ? requestMap.get("RequestInfo") : requestMap.get("requestInfo");
            if (Objects.isNull(requestInfo)) {
                return null;
            }

            if (requestInfo instanceof Map) {
                correlationId = (String)((Map)requestInfo).get("correlationId");
            }
        } catch (Exception var5) {
        }

        return correlationId;
    }


}
