package com.dristi.njdg_transformer.producer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class Producer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public Producer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void push(String topic, Object value) {
        try {
            kafkaTemplate.send(topic, value);
            log.info("Message sent successfully.");
        } catch (Exception e) {
            log.error("Error in sending message:: {}", e.getMessage());
        }
    }
}
