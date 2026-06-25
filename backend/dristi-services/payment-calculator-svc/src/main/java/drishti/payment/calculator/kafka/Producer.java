package drishti.payment.calculator.kafka;

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
        kafkaProducerService.send(topic, value);
    }
}
