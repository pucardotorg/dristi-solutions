package digit.consumer;

import digit.service.PaymentUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentBackUpdateConsumer {

    private final PaymentUpdateService paymentUpdateService;

    @KafkaListener(topics = {"${kafka.topics.receipt.create}"})
    public void listenPayments(final Map<String, Object> data, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received record: {} on topic: {}", data, topic);
            paymentUpdateService.process(data);
        } catch (final Exception e) {
            log.error("Error while listening to value: {} on topic: {}: ", data, topic, e);
        }
    }
}
