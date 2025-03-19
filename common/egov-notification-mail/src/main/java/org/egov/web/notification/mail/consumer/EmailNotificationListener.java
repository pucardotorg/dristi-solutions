package org.egov.web.notification.mail.consumer;

import java.util.HashMap;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.web.notification.mail.consumer.contract.EmailRequest;
import org.egov.web.notification.mail.service.EmailService;
import org.egov.web.notification.mail.service.MessageConstruction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
@Service
public class EmailNotificationListener {


    private EmailService emailService;

    private ObjectMapper objectMapper;

    private MessageConstruction messageConstruction;

    @Autowired
    public EmailNotificationListener(EmailService emailService, ObjectMapper objectMapper, MessageConstruction messageConstruction) {
        this.emailService = emailService;
        this.objectMapper = objectMapper;
        this.messageConstruction = messageConstruction;
    }

    @KafkaListener(topics = "${kafka.topics.notification.mail.name}")
    public void listen(final HashMap<String, Object> record) {
        try {
            EmailRequest emailRequest = objectMapper.convertValue(record, EmailRequest.class);
            log.info("Sending email to {}", emailRequest.getEmail().getEmailTo());
            String message = messageConstruction.constructMessage(emailRequest.getEmail());
            emailRequest.getEmail().setBody(message);
            emailService.sendEmail(emailRequest.getEmail());
            log.info("Email sent to {}", emailRequest.getEmail().getEmailTo());
        } catch (IllegalArgumentException e) {
            log.error("Error while sending email", e);
            throw new CustomException("ERR_MAIL_SEND", "Error while sending email");
        }

    }



}
