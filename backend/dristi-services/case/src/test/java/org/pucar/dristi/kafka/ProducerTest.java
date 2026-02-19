package org.pucar.dristi.kafka;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

public class ProducerTest {

    @Mock
    private KafkaProducerService kafkaProducerService;

    @InjectMocks
    private Producer producer;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testPush() {
        // Arrange
        String topic = "test-topic";
        Object value = "test-value";

        // Act
        producer.push(topic, value);

        // Assert
        verify(kafkaProducerService, times(1)).send(topic, value);
    }
}
