package org.egov.transformer.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.producer.Producer;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.digitalized_document.DigitalizedDocument;
import org.egov.transformer.models.digitalized_document.DigitalizedDocumentRequest;
import org.egov.transformer.service.DigitalizedDocumentService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DigitalizedDocumentConsumer {

    private final DigitalizedDocumentService digitalizedDocumentService;
    private final ObjectMapper objectMapper;
    private final Producer producer;
    private final TransformerProperties transformerProperties;

    public DigitalizedDocumentConsumer(DigitalizedDocumentService digitalizedDocumentService, ObjectMapper objectMapper, Producer producer, TransformerProperties transformerProperties) {
        this.digitalizedDocumentService = digitalizedDocumentService;
        this.objectMapper = objectMapper;
        this.producer = producer;
        this.transformerProperties = transformerProperties;
    }

    @KafkaListener(topics = {"${transformer.consumer.create.examination.of.accused.document.topic}",
            "${transformer.consumer.update.examination.of.accused.document.topic}",
            "${transformer.consumer.create.mediation.document.topic}",
            "${transformer.consumer.update.mediation.document.topic}",
            "${transformer.consumer.create.plea.document.topic}",
            "${transformer.consumer.update.plea.document.topic}"})
    public void saveDigitalizedDocument(ConsumerRecord<String, Object> payload,
                                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        publishDigitalizedDocument(payload, topic);
    }

    public void publishDigitalizedDocument(ConsumerRecord<String, Object> payload,
                                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic){
        DigitalizedDocumentRequest request = null;
        try {
            request = objectMapper.readValue((String) payload.value(), DigitalizedDocumentRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();

        digitalizedDocumentService.enrichDigitalizedDocument(request);

        producer.push(transformerProperties.getDigitalizedDocumentTopic(), digitalizedDocument);


    }
}
