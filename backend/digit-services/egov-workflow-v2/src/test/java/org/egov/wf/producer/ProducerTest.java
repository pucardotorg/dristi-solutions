package org.egov.wf.producer;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.egov.wf.config.WorkflowConfig;
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

    @MockBean
    private WorkflowConfig workflowConfig;

    @Test
    void testPush() {
        when(workflowConfig.getIsEnvironmentCentralInstance()).thenReturn(true);
        ProducerRecord<String, Object> producerRecord = new ProducerRecord<>("Topic", "Value");

        producer.push("42", "Topic", "Value");
        verify(workflowConfig).getIsEnvironmentCentralInstance();
        verify(kafkaProducerService).send((String) any(), (Object) any());
    }

    @Test
    void testPush2() {
        when(workflowConfig.getIsEnvironmentCentralInstance()).thenReturn(false);
        ProducerRecord<String, Object> producerRecord = new ProducerRecord<>("Topic", "Value");

        producer.push("42", "Topic", "Value");
        verify(workflowConfig).getIsEnvironmentCentralInstance();
        verify(kafkaProducerService).send((String) any(), (Object) any());
    }

    @Test
    void testPush3() {
        when(workflowConfig.getIsEnvironmentCentralInstance()).thenReturn(true);
        ProducerRecord<String, Object> producerRecord = new ProducerRecord<>("Topic", "Value");

        producer.push("org.egov.wf.producer.Producer", "Topic", "Value");
        verify(workflowConfig).getIsEnvironmentCentralInstance();
        verify(kafkaProducerService).send((String) any(), (Object) any());
    }
}

