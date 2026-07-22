package org.egov.healthdashboard.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.healthdashboard.consumer.HealthStatusConsumer;
import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class HealthStatusConsumerTest {

    @Mock
    private ServiceHealthRepository serviceHealthRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private HealthStatusConsumer healthStatusConsumer;

    @BeforeEach
    void setUp() {
        healthStatusConsumer = new HealthStatusConsumer(serviceHealthRepository, objectMapper);
    }

    @Test
    void consumeHealthStatus_persistsDeserializedStatus_whenPayloadIsValid() {
        String payload = "{" +
                "\"serviceName\":\"SMS\"," +
                "\"serviceUrl\":\"https://msdgweb.mgov.gov.in\"," +
                "\"lastStatus\":\"UP\"," +
                "\"lastUpdatedTime\":1000," +
                "\"responseTimeMs\":50," +
                "\"message\":\"HTTP 200\"" +
                "}";

        healthStatusConsumer.consumeHealthStatus(payload);

        ArgumentCaptor<ServiceHealthStatus> captor = ArgumentCaptor.forClass(ServiceHealthStatus.class);
        verify(serviceHealthRepository).insert(captor.capture());
        ServiceHealthStatus status = captor.getValue();
        assertThat(status.getServiceName()).isEqualTo("SMS");
        assertThat(status.getLastStatus()).isEqualTo("UP");
        assertThat(status.getLastUpdatedTime()).isEqualTo(1000L);
        assertThat(status.getResponseTimeMs()).isEqualTo(50L);
        assertThat(status.getMessage()).isEqualTo("HTTP 200");
    }

    @Test
    void consumeHealthStatus_doesNotThrowAndSkipsInsert_whenPayloadIsMalformed() {
        String malformedPayload = "not-valid-json";

        assertThatCode(() -> healthStatusConsumer.consumeHealthStatus(malformedPayload))
                .doesNotThrowAnyException();

        verifyNoInteractions(serviceHealthRepository);
    }

    @Test
    void consumeHealthStatus_doesNotPropagateException_whenRepositoryInsertFails() {
        String payload = "{\"serviceName\":\"ICOPS\",\"lastStatus\":\"DOWN\"}";
        doThrow(new RuntimeException("db unavailable")).when(serviceHealthRepository).insert(org.mockito.ArgumentMatchers.any());

        assertThatCode(() -> healthStatusConsumer.consumeHealthStatus(payload))
                .doesNotThrowAnyException();
    }
}
