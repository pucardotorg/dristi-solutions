package digit.kafka;

import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProducerTest {

    @Mock
    private CustomKafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private Producer producer;

    @Test
    public void testPush_WithStringValue() {
        // Arrange
        String topic = "test-topic";
        String value = "test-value";

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic, value);
    }

    @Test
    public void testPush_WithObjectValue() {
        // Arrange
        String topic = "object-topic";
        Object value = new Object();

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic, value);
    }

    @Test
    public void testPush_WithNullTopic() {
        // Arrange
        String topic = null;
        String value = "test-value";

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send(null, value);
    }

    @Test
    public void testPush_WithNullValue() {
        // Arrange
        String topic = "test-topic";
        Object value = null;

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic, null);
    }

    @Test
    public void testPush_WithEmptyTopic() {
        // Arrange
        String topic = "";
        String value = "test-value";

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send("", value);
    }

    @Test
    public void testPush_WithComplexObject() {
        // Arrange
        String topic = "complex-topic";
        ComplexTestObject value = new ComplexTestObject("test", 123);

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic, value);
    }

    @Test
    public void testPush_MultipleCalls() {
        // Arrange
        String topic1 = "topic-1";
        String topic2 = "topic-2";
        String value1 = "value-1";
        String value2 = "value-2";

        // Act
        producer.push(topic1, value1);
        producer.push(topic2, value2);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic1, value1);
        verify(kafkaTemplate, times(1)).send(topic2, value2);
        verify(kafkaTemplate, times(2)).send(anyString(), any());
    }

    @Test
    public void testPush_SameTopicMultipleTimes() {
        // Arrange
        String topic = "same-topic";
        String value1 = "value-1";
        String value2 = "value-2";
        String value3 = "value-3";

        // Act
        producer.push(topic, value1);
        producer.push(topic, value2);
        producer.push(topic, value3);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic, value1);
        verify(kafkaTemplate, times(1)).send(topic, value2);
        verify(kafkaTemplate, times(1)).send(topic, value3);
        verify(kafkaTemplate, times(3)).send(eq(topic), any());
    }

    @Test
    public void testPush_WithDifferentTopicNames() {
        // Test with various topic naming conventions
        String[] topics = {
            "create-survey-tracker",
            "update-survey-tracker",
            "update-expiry-date",
            "create-feedback",
            "topic.with.dots",
            "topic-with-dashes",
            "topic_with_underscores",
            "TopicWithCamelCase"
        };

        for (String topic : topics) {
            Object value = "value-for-" + topic;
            producer.push(topic, value);
            verify(kafkaTemplate, times(1)).send(topic, value);
        }
    }

    @Test
    public void testPush_WithDifferentValueTypes() {
        // Test with different value types
        String topic = "multi-type-topic";

        // String
        producer.push(topic, "string-value");
        verify(kafkaTemplate, times(1)).send(topic, "string-value");

        // Integer
        producer.push(topic, 123);
        verify(kafkaTemplate, times(1)).send(topic, 123);

        // Long
        producer.push(topic, 123456789L);
        verify(kafkaTemplate, times(1)).send(topic, 123456789L);

        // Boolean
        producer.push(topic, true);
        verify(kafkaTemplate, times(1)).send(topic, true);

        // Array
        String[] array = {"a", "b", "c"};
        producer.push(topic, array);
        verify(kafkaTemplate, times(1)).send(topic, array);
    }

    @Test
    public void testPush_VerifyNoOtherInteractions() {
        // Arrange
        String topic = "test-topic";
        String value = "test-value";

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaTemplate, times(1)).send(topic, value);
        verifyNoMoreInteractions(kafkaTemplate);
    }

    // Helper class for testing complex objects
    private static class ComplexTestObject {
        private String name;
        private int value;

        public ComplexTestObject(String name, int value) {
            this.name = name;
            this.value = value;
        }

        public String getName() {
            return name;
        }

        public int getValue() {
            return value;
        }
    }
}
