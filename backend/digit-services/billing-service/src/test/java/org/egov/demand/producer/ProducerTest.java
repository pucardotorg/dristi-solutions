package org.egov.demand.producer;

import org.egov.common.utils.MultiStateInstanceUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProducerTest {

    @Mock
    private KafkaProducerService kafkaProducerService;

    @Mock
    private MultiStateInstanceUtil centralInstanceUtil;

    @InjectMocks
    private Producer producer;

    private final String tenantId = "kl";
    private final String topic = "demand-update";
    private final String updatedTopic = "kl-demand-update";
    private final Object payload = new Object();

    @BeforeEach
    void setup() {
        when(centralInstanceUtil.getStateSpecificTopicName(tenantId, topic))
                .thenReturn(updatedTopic);
    }

    @Test
    void shouldPushMessageToUpdatedTopic() {

        // Act
        producer.push(tenantId, topic, payload);

        // Assert
        verify(centralInstanceUtil, times(1))
                .getStateSpecificTopicName(tenantId, topic);

        verify(kafkaProducerService, times(1))
                .send(updatedTopic, payload);
    }

    @Test
    void shouldNotCallKafkaIfTopicResolutionFails() {

        // Arrange
        when(centralInstanceUtil.getStateSpecificTopicName(tenantId, topic))
                .thenThrow(new RuntimeException("Topic resolution failed"));

        // Act & Assert
        try {
            producer.push(tenantId, topic, payload);
        } catch (RuntimeException ignored) {
        }

        verify(kafkaProducerService, never())
                .send(anyString(), any());
    }
}
