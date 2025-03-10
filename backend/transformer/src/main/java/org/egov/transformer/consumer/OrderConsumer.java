package org.egov.transformer.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.event.manager.OrderNotificationEventManager;
import org.egov.transformer.models.Order;
import org.egov.transformer.models.OrderRequest;
import org.egov.transformer.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OrderConsumer {

    private static final Logger logger = LoggerFactory.getLogger(OrderConsumer.class);

    private final ObjectMapper objectMapper;
    private final OrderService orderService;
    private final TransformerProperties transformerProperties;
    private final OrderNotificationEventManager eventManager;

    @Autowired
    public OrderConsumer(ObjectMapper objectMapper,
                         OrderService orderService,
                         TransformerProperties transformerProperties, OrderNotificationEventManager eventManager) {
        this.objectMapper = objectMapper;
        this.orderService = orderService;
        this.transformerProperties = transformerProperties;
        this.eventManager = eventManager;
    }

    @KafkaListener(topics = {"${transformer.consumer.create.order.topic}"})
    public void saveOrder(ConsumerRecord<String, Object> payload,
                          @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            publishOrder(payload, transformerProperties.getSaveOrderTopic());
        } catch (Exception e) {
            log.error("error occurred in publish order method :{}, topic : {}", e, topic);
        }
        pushOrderAndNotification(payload, topic);

    }

    @KafkaListener(topics = {"${transformer.consumer.update.order.topic}"})
    public void updateOrder(ConsumerRecord<String, Object> payload,
                            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        try{
            publishOrder(payload, transformerProperties.getUpdateOrderTopic());
        }catch (Exception e) {
            log.error("error occurred in publish order method :{}, topic : {}", e, topic);
        }
        pushOrderAndNotification(payload, topic);
    }


    private void publishOrder(ConsumerRecord<String, Object> payload,
                              @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            Order order = (objectMapper.readValue((String) payload.value(), new TypeReference<OrderRequest>() {
            })).getOrder();
            logger.info(objectMapper.writeValueAsString(order));
            orderService.addOrderDetails(order, topic);
        } catch (Exception exception) {
            log.error("error in saving order", exception);
        }
    }

    private void pushOrderAndNotification(ConsumerRecord<String, Object> payload, String topic) {

        try {
            Order order = (objectMapper.readValue((String) payload.value(), new TypeReference<OrderRequest>() {
            })).getOrder();
            RequestInfo requestInfo = (objectMapper.readValue((String) payload.value(), new TypeReference<OrderRequest>() {
            })).getRequestInfo();
            eventManager.notifyByObjects(order, requestInfo);

        } catch (Exception e) {
            log.debug(" payload : {} , topic : {}", payload.value(), topic);
            log.error("Error occurred while serializing order request", e);

        }
    }
}
