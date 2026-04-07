package org.pucar.dristi.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class Producer {

    @Autowired
    private final KafkaProducerService kafkaProducerService;

    public Producer(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    public void push(String topic, Object value) {
        try {
            log.info("Pushing message to Kafka topic: {}", topic);
            kafkaProducerService.send(topic, value);
        } catch (Exception e) {
            log.error("Error pushing message to Kafka topic: {}", topic, e);
            throw new RuntimeException("Failed to push message to Kafka topic: " + topic, e);
        }
    }
}
