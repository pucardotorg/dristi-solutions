package org.egov.transformer.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.transformer.event.manager.OrderNotificationEventManager;
import org.egov.transformer.models.NotificationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationConsumer {

    private final OrderNotificationEventManager eventManager;
    private final ObjectMapper objectMapper;

    @Autowired
    public NotificationConsumer(OrderNotificationEventManager eventManager, ObjectMapper objectMapper) {
        this.eventManager = eventManager;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"${transformer.consumer.create.notification.topic}"})
    public void saveNotification(ConsumerRecord<String, Object> payload,
                                 @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            String saveNotificationRequest = objectMapper.writeValueAsString(payload.value());
            NotificationRequest request = objectMapper.readValue(saveNotificationRequest, NotificationRequest.class);
            eventManager.notifyByObjects(request.getNotification(), request.getRequestInfo());

        } catch (Exception e) {
            log.debug("create payload : {}", payload.value());
            log.error("Error occurred while serializing save notification request", e);

        }


    }

    @KafkaListener(topics = {"${transformer.consumer.update.notification.topic}"})
    public void updateOrder(ConsumerRecord<String, Object> payload,
                            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        try {
            String updateNotificationRequest = objectMapper.writeValueAsString(payload.value());
            NotificationRequest request = objectMapper.readValue(updateNotificationRequest, NotificationRequest.class);
            eventManager.notifyByObjects(request.getNotification(), request.getRequestInfo());
        } catch (Exception e) {
            log.debug("update payload : {}", payload.value());
            log.error("Error occurred while serializing update notification request", e);

        }

    }
}
