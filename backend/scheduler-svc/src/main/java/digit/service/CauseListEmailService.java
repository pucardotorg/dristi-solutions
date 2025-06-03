package digit.service;


import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.web.models.email.Email;
import digit.web.models.email.EmailRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.egov.common.contract.request.RequestInfo;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CauseListEmailService {

    private final CustomKafkaTemplate<String, EmailRequest> kafkaTemplate;
    private final Configuration config;
    private final MultiStateInstanceUtil centralInstanceUtil;

    @Autowired
    public CauseListEmailService(CustomKafkaTemplate<String, EmailRequest> kafkaTemplate,
                                 Configuration config,
                                 MultiStateInstanceUtil centralInstanceUtil) {
        this.kafkaTemplate = kafkaTemplate;
        this.config = config;
        this.centralInstanceUtil = centralInstanceUtil;
    }

    /**
     * Sends an email with the cause list PDF as an attachment
     *
     * @param fileStoreId The file store ID of the generated cause list PDF
     * @param hearingDate The date for which the cause list is generated
     * @param requestInfo Request information
     * @param tenantId tenantId
     */
    public void sendCauseListEmail(String fileStoreId, String hearingDate, RequestInfo requestInfo, String tenantId) {
        try {
            // Format the hearing date for email subject
            LocalDate date = LocalDate.parse(hearingDate);
            String formattedDate = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

            // Create the email subject with the formatted date
            String subject = config.getCauseListSubject().replace("${date_of_causeList}", formattedDate);

            // Create file store map with attachment
            Map<String, String> fileStoreMap = new HashMap<>();
            fileStoreMap.put(fileStoreId, String.format(ServiceConstants.CAUSE_LIST_FILE_NAME_PATTERN, formattedDate));

            // Convert comma-separated recipients string to a Set
            Set<String> emailRecipients = Arrays.stream(config.getCauseListRecipients().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());

            // Build email object
            Email email = Email.builder()
                    .subject(subject)
                    .body(ServiceConstants.CAUSE_LIST_EMAIL_BODY)
                    .isHTML(false)
                    .emailTo(emailRecipients)
                    .fileStoreId(fileStoreMap)
                    .tenantId(config.getEgovStateTenantId())
                    .build();

            // Create email request
            EmailRequest emailRequest = EmailRequest.builder()
                    .requestInfo(requestInfo)
                    .email(email)
                    .build();

            String updatedTopic = centralInstanceUtil.getStateSpecificTopicName(tenantId, config.getEmailTopic());

            kafkaTemplate.send(updatedTopic, emailRequest);

            log.info("Cause list email sent successfully for date: {}", hearingDate);
        } catch (Exception e) {
            log.error("Failed to send cause list email for date: {}, error: {}", hearingDate, e.getMessage(), e);
            throw new CustomException(ServiceConstants.EMAIL_SEND_ERROR,
                    ServiceConstants.EMAIL_SEND_ERROR_MESSAGE + e.getMessage());
        }
    }
}