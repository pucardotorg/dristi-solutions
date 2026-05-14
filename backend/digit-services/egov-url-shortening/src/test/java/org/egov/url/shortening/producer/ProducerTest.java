package org.egov.url.shortening.producer;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ContextConfiguration(classes = {Producer.class})
@ExtendWith(SpringExtension.class)
class ProducerTest {
    @MockBean
    private KafkaProducerService kafkaProducerService;

    @Autowired
    private Producer producer;


    @Test
    void testPush() {
        ProducerRecord<String, Object> producerRecord = new ProducerRecord<>("Topic", "Value");

        this.producer.push("https://example.org/example", "Value");
        verify(this.kafkaProducerService).send((String) any(), (Object) any());
    }
}

