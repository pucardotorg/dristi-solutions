package org.egov.web.notification.mail.consumer;

import java.util.HashMap;
import java.util.List;

import com.github.jknack.handlebars.internal.text.StringEscapeUtils;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.web.notification.mail.config.ApplicationConfiguration;
import org.egov.web.notification.mail.config.EmailProperties;
import org.egov.web.notification.mail.consumer.contract.EmailRequest;
import org.egov.web.notification.mail.service.EmailService;
import org.egov.web.notification.mail.service.MessageConstruction;
import org.egov.web.notification.mail.utils.Constants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import static org.egov.web.notification.mail.utils.Constants.*;

@Slf4j
@Service
public class EmailNotificationListener {


    private EmailService emailService;

    private ObjectMapper objectMapper;

    private MessageConstruction messageConstruction;

    private final EmailProperties properties;

    private final ApplicationConfiguration applicationConfiguration;

    @Autowired
    public EmailNotificationListener(EmailService emailService, ObjectMapper objectMapper, MessageConstruction messageConstruction, EmailProperties properties, ApplicationConfiguration applicationConfiguration) {
        this.emailService = emailService;
        this.objectMapper = objectMapper;
        this.messageConstruction = messageConstruction;
        this.properties = properties;
        this.applicationConfiguration = applicationConfiguration;
    }

    @KafkaListener(topics = "${kafka.topics.notification.mail.name}")
    public void listen(final HashMap<String, Object> record) {
        try {
            EmailRequest emailRequest = objectMapper.convertValue(record, EmailRequest.class);
            log.info("Sending email to {}", emailRequest.getEmail().getEmailTo());
            String originalBody = emailRequest.getEmail().getBody();
            originalBody = originalBody.replace("\\n", "\n");
            String message = messageConstruction.constructMessage(emailRequest.getEmail());

            if (Constants.CAUSELIST_EMAIL_TEMPLATE_CODE.equalsIgnoreCase(emailRequest.getEmail().getTemplateCode())) {
                message = StringEscapeUtils.unescapeHtml4(message);
            }

            emailRequest.getEmail().setBody(message);
            List<String> bailBondTemplateCodes = applicationConfiguration.getCustomEmailSubject();
            if (bailBondTemplateCodes != null && bailBondTemplateCodes.stream()
                    .anyMatch(code -> code.equalsIgnoreCase(emailRequest.getEmail().getTemplateCode()))) {
                emailRequest.getEmail().setBody(originalBody);
            }
            emailService.sendEmail(emailRequest.getEmail());
            log.info("Email sent to {}", properties.getMailSenderTest() ? properties.getTestEmail() : emailRequest.getEmail().getEmailTo());
        } catch (IllegalArgumentException e) {
            log.error("Error while sending email", e);
            throw new CustomException("ERR_MAIL_SEND", "Error while sending email");
        }
    }



}
