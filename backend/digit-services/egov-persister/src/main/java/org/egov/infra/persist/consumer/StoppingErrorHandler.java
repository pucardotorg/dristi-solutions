package org.egov.infra.persist.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.stereotype.Component;

@Component
public class StoppingErrorHandler implements CommonErrorHandler {

  @Autowired
  private KafkaListenerEndpointRegistry kafkaListenerEndpointRegistry;

  @Override
  public boolean handleOne(Exception thrownException, ConsumerRecord<?, ?> record,
      org.apache.kafka.clients.consumer.Consumer<?, ?> consumer,
      org.springframework.kafka.listener.MessageListenerContainer container) {
    kafkaListenerEndpointRegistry.stop();
    return true;
  }

}
