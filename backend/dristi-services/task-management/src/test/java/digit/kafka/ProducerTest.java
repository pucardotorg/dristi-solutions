package digit.kafka;

import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProducerTest {

    @Mock
    private CustomKafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private Producer producer;

    @Test
    void push_CallsKafkaTemplateSend() {
        String topic = "test-topic";
        Object value = "test-message";

        producer.push(topic, value);

        verify(kafkaTemplate, times(1)).send(topic, value);
    }

    @Test
    void push_WithComplexObject() {
        String topic = "complex-topic";
        TestMessage value = new TestMessage("id-123", "Test Content");

        producer.push(topic, value);

        verify(kafkaTemplate, times(1)).send(topic, value);
    }

    @Test
    void push_WithNullValue() {
        String topic = "null-value-topic";

        producer.push(topic, null);

        verify(kafkaTemplate, times(1)).send(topic, null);
    }

    @Test
    void push_MultipleCalls() {
        producer.push("topic1", "message1");
        producer.push("topic2", "message2");
        producer.push("topic3", "message3");

        verify(kafkaTemplate, times(3)).send(anyString(), any());
    }

    // Helper class for testing complex objects
    private static class TestMessage {
        private final String id;
        private final String content;

        TestMessage(String id, String content) {
            this.id = id;
            this.content = content;
        }
    }
}
