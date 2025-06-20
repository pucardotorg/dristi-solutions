package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.service.BillingService;
import org.pucar.dristi.service.IndexerService;
import org.pucar.dristi.util.BillingUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.Util;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class Consumer {

    private IndexerService indexerService;

    private BillingService billingService;

    private ObjectMapper objectMapper;

    @Autowired
    public Consumer(BillingService billingService, IndexerService indexerService, ObjectMapper objectMapper) {
        this.billingService = billingService;
        this.indexerService = indexerService;
        this.objectMapper = objectMapper;
    }


    @KafkaListener(id = "demandGenerateListener",topics = {"${kafka.topic.demand.generate}"}, containerFactory = "billingContainerFactory")
    private void handleDemandGenerateTopic(final HashMap<String, Object> record) {
        try {
            log.info("Listening to demand generate topic, kafkaJson: {}", record);
            String jsonRecord = objectMapper.writeValueAsString(record);
            billingService.processDemand(jsonRecord,null);
        } catch (Exception e) {
            log.error("Error while processing demand generate topic: ", e);
        }
    }

    @KafkaListener(id = "paymentCollectListener",topics = {"${kafka.topic.egov.collection.payment.create}"}, containerFactory = "billingContainerFactory")
    private void handlePaymentCollectTopic(final HashMap<String, Object> record) {
        try {
            log.info("Listening to payment collect topic, kafkaJson: {}", record);
            String jsonRecord = objectMapper.writeValueAsString(record);
            billingService.processPayment(jsonRecord);
        } catch (Exception e) {
            log.error("Error while processing payment collect topic: ", e);
        }
    }

    @KafkaListener(id = "workflowTransitionListener",topics = {"${kafka.topic.save.wf.transitions}"}, containerFactory = "indexerContainerFactory")
    private void handleWorkflowTransitionTopics(final HashMap<String, Object> record) {
        try {
            log.info("Listening to save wf transitions topic, kafkaJson: {}", record);
            String jsonRecord = objectMapper.writeValueAsString(record);
            indexerService.esIndexer(jsonRecord);
        } catch (Exception e) {
            log.error("Error while processing workflow transition topic: ", e);
        }
    }

}
