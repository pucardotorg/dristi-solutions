package org.egov.healthdashboard.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class HealthStatusConsumer {

    private final ServiceHealthRepository serviceHealthRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public HealthStatusConsumer(ServiceHealthRepository serviceHealthRepository, ObjectMapper objectMapper) {
        this.serviceHealthRepository = serviceHealthRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "${kafka.topics.health.status}")
    public void consumeHealthStatus(String record) {
        try {
            ServiceHealthStatus status = objectMapper.readValue(record, ServiceHealthStatus.class);
            serviceHealthRepository.insert(status);
            log.info("Persisted health status from kafka: service={}, status={}",
                    status.getServiceName(), status.getLastStatus());
        } catch (Exception e) {
            log.error("Failed to process health status kafka message: {}", e.getMessage(), e);
        }
    }
}