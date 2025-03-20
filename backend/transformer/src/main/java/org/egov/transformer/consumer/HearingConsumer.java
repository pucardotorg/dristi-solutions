package org.egov.transformer.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.Hearing;
import org.egov.transformer.models.HearingBulkRequest;
import org.egov.transformer.models.HearingRequest;
import org.egov.transformer.service.HearingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class HearingConsumer {
    private static final Logger logger = LoggerFactory.getLogger(HearingConsumer.class);
    private final ObjectMapper objectMapper;

    private final HearingService hearingService;
    private final TransformerProperties transformerProperties;

    @Autowired
    public HearingConsumer(ObjectMapper objectMapper, HearingService hearingService, TransformerProperties transformerProperties) {
        this.objectMapper = objectMapper;
        this.hearingService = hearingService;
        this.transformerProperties = transformerProperties;
    }

    @KafkaListener(topics = {"${transformer.consumer.create.hearing.topic}"})
    public void saveHearing(ConsumerRecord<String, Object> payload,
                            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishHearing(payload, transformerProperties.getSaveHearingTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.update.hearing.topic}"})
    public void updateHearing(ConsumerRecord<String, Object> payload,
                              @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishHearing(payload, transformerProperties.getUpdateHearingTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.update.start.end.time.topic}"})
    public void updateStartEndTime(ConsumerRecord<String, Object> payload,
                                   @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishHearing(payload, transformerProperties.getUpdateHearingTopic());
    }

    @KafkaListener(topics = {"${transformer.consumer.bulk.reschedule.hearing}"})
    public void bulkRescheduleHearing(ConsumerRecord<String, Object> payload,
                                      @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        publishBulkHearing(payload, transformerProperties.getUpdateHearingTopic());
    }

    private void publishHearing(ConsumerRecord<String, Object> payload,
                                @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            Hearing hearing = (objectMapper.readValue((String) payload.value(), new TypeReference<HearingRequest>() {
            })).getHearing();
            HearingRequest hearingRequest = objectMapper.readValue(payload.value().toString(), HearingRequest.class);
            logger.info(objectMapper.writeValueAsString(hearing));
            hearingService.addCaseDetailsToHearing(hearing, topic);
            hearingService.enrichOpenHearings(hearingRequest);
        } catch (Exception exception) {
            logger.error("error in saving hearing", exception);
        }
    }

    private void publishBulkHearing(ConsumerRecord<String, Object> payload,
                                    @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            HearingBulkRequest bulkRequest = objectMapper.readValue(payload.value().toString(), HearingBulkRequest.class);
            List<Hearing> hearings = bulkRequest.getHearings();
            log.info("Updating bulk hearings.");
            for (Hearing hearing: hearings) {
                HearingRequest request = HearingRequest.builder()
                        .requestInfo(bulkRequest.getRequestInfo())
                        .hearing(hearing).build();
                hearingService.addCaseDetailsToHearing(hearing, topic);
                hearingService.enrichOpenHearings(request);
            }
        }catch (Exception exception) {
            logger.error("error in saving hearing", exception);
        }
    }
}