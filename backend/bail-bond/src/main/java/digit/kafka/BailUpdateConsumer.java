package digit.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.service.BailService;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;


@Component
@Slf4j
public class BailUpdateConsumer {

    private final BailService bailService;
    private final ObjectMapper objectMapper;

    public BailUpdateConsumer(BailService bailService, ObjectMapper objectMapper) {
        this.bailService = bailService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"${bail.case.number.update}"})
    public void updateCaseNumberConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received case number details on topic: {}", topic);
            bailService.updateCaseNumberBail(objectMapper.convertValue(payload.value(), Map.class));
            log.info("Updated case number for bail");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to case number details topic: {}: {}", topic, e.getMessage());
        }

    }
}
