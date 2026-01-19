package com.dristi.njdg_transformer.producer;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProducerTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private Producer producer;

    @Test
    void testPush_Success() {
        String topic = "test-topic";
        Object value = "test-message";

        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaTemplate).send(topic, value);
    }

    @Test
    void testPush_WithObjectValue() {
        String topic = "test-topic";
        TestObject value = new TestObject("test", 123);

        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaTemplate).send(topic, value);
    }

    @Test
    void testPush_WithNullValue() {
        String topic = "test-topic";

        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        assertDoesNotThrow(() -> producer.push(topic, null));
        verify(kafkaTemplate).send(topic, null);
    }

    @Test
    void testPush_ExceptionHandled() {
        String topic = "test-topic";
        Object value = "test-message";

        when(kafkaTemplate.send(anyString(), any()))
                .thenThrow(new RuntimeException("Kafka error"));

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaTemplate).send(topic, value);
    }

    @Test
    void testPush_MultipleMessages() {
        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        producer.push("topic1", "message1");
        producer.push("topic2", "message2");
        producer.push("topic3", "message3");

        verify(kafkaTemplate, times(3)).send(anyString(), any());
    }

    @Test
    void testPush_EmptyTopic() {
        String topic = "";
        Object value = "test-message";

        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaTemplate).send(topic, value);
    }

    @Test
    void testPush_LargePayload() {
        String topic = "test-topic";
        StringBuilder largePayload = new StringBuilder();
        for (int i = 0; i < 10000; i++) {
            largePayload.append("data");
        }

        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        assertDoesNotThrow(() -> producer.push(topic, largePayload.toString()));
        verify(kafkaTemplate).send(topic, largePayload.toString());
    }

    // Helper class for testing
    private static class TestObject {
        private String name;
        private int value;

        public TestObject(String name, int value) {
            this.name = name;
            this.value = value;
        }
    }
}
