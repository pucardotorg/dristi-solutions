package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.EmailTemplateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailNotificationService {
    private final Configuration config;
    private final Producer producer;

    @Autowired
    public EmailNotificationService(Configuration config, Producer producer) {
        this.config = config;
        this.producer = producer;
    }

    public void sendEmail(RequestInfo requestInfo, EmailTemplateData emailTemplateData, String recipientType, String name, String email) {
        // TODO: Implement actual email sending logic, e.g., publish to Kafka/email topic or call external service
        log.info("Sending email to {} <{}> for recipientType {} with data: {}", name, email, recipientType, emailTemplateData);
        // Example: producer.push(config.getEmailNotificationTopic(), ...);
    }
}
