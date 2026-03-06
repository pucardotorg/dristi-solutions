package org.egov.transformer.producer;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TransformerProducer {
    private final KafkaProducerService kafkaProducerService;

    @Autowired
    public TransformerProducer(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    public void push(String topic, Object value) {
        this.kafkaProducerService.send(topic, value);
    }
}