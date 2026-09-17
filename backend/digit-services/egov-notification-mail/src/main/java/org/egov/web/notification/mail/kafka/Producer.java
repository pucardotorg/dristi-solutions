package org.egov.web.notification.mail.kafka;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service("kafkaProducer")
public class Producer {

    @Autowired
    private final KafkaProducerService kafkaProducerService;

    public Producer(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    public void push(String topic, Object value) {
        kafkaProducerService.send(topic, value);
    }
}