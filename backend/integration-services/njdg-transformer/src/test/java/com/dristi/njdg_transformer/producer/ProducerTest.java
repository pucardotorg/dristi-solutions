package com.dristi.njdg_transformer.producer;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProducerTest {

    @Mock
    private KafkaProducerService kafkaProducerService;

    @InjectMocks
    private Producer producer;

    @Test
    void testPush_Success() {
        String topic = "test-topic";
        Object value = "test-message";

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaProducerService).send(topic, value);
    }

    @Test
    void testPush_WithObjectValue() {
        String topic = "test-topic";
        TestObject value = new TestObject("test", 123);

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaProducerService).send(topic, value);
    }

    @Test
    void testPush_WithNullValue() {
        String topic = "test-topic";

        assertDoesNotThrow(() -> producer.push(topic, null));
        verify(kafkaProducerService).send(topic, null);
    }

    @Test
    void testPush_ExceptionHandled() {
        String topic = "test-topic";
        Object value = "test-message";

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaProducerService).send(topic, value);
    }

    @Test
    void testPush_MultipleMessages() {
        producer.push("topic1", "message1");
        producer.push("topic2", "message2");
        producer.push("topic3", "message3");

        verify(kafkaProducerService, times(3)).send(anyString(), any());
    }

    @Test
    void testPush_EmptyTopic() {
        String topic = "";
        Object value = "test-message";

        assertDoesNotThrow(() -> producer.push(topic, value));
        verify(kafkaProducerService).send(topic, value);
    }

    @Test
    void testPush_LargePayload() {
        String topic = "test-topic";
        StringBuilder largePayload = new StringBuilder();
        for (int i = 0; i < 10000; i++) {
            largePayload.append("data");
        }

        assertDoesNotThrow(() -> producer.push(topic, largePayload.toString()));
        verify(kafkaProducerService).send(topic, largePayload.toString());
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
