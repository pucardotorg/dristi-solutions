package digit.service;


import com.google.gson.Gson;
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
    public void sendCauseListEmail(String fileStoreId, LocalDate hearingDate, RequestInfo requestInfo, String tenantId) {
        log.info("operation = sendCauseListEmail, result = IN_PROGRESS, hearingDate = {}", hearingDate);

        try {
            if (fileStoreId == null || fileStoreId.trim().isEmpty()) {
                throw new CustomException("INVALID_INPUT", "FileStoreId cannot be null or empty");
            }
            if (requestInfo == null) {
                throw new CustomException("INVALID_INPUT", "RequestInfo cannot be null");
            }
            if (hearingDate == null) {
                throw new CustomException("INVALID_INPUT", "HearingDate cannot be null");
            }

            String formattedDate = hearingDate.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

            String updatedTenantId = tenantId == null ? config.getEgovStateTenantId() : tenantId;

            // Create the email subject with the formatted date
            String subject = config.getCauseListSubject().replace("{date_of_causeList}", formattedDate);

            // Create file store map with attachment
            Map<String, String> fileStoreMap = new HashMap<>();
            fileStoreMap.put(fileStoreId, String.format(ServiceConstants.CAUSE_LIST_FILE_NAME_PATTERN, formattedDate));

            // Convert comma-separated recipients string to a Set
            Set<String> emailRecipients = Arrays.stream(config.getCauseListRecipients().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());

            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("emailBody", ServiceConstants.CAUSE_LIST_EMAIL_BODY);
            String emailBody = new Gson().toJson(bodyMap);


            // Build email object
            Email email = Email.builder()
                    .subject(subject)
                    .body(emailBody)
                    .isHTML(true)
                    .emailTo(emailRecipients)
                    .fileStoreId(fileStoreMap)
                    .tenantId(updatedTenantId)
                    .templateCode(ServiceConstants.CAUSE_LIST_EMAIL_TEMPLATE_CODE)
                    .build();

            // Create email request
            EmailRequest emailRequest = EmailRequest.builder()
                    .requestInfo(requestInfo)
                    .email(email)
                    .build();

            String updatedTopic = centralInstanceUtil.getStateSpecificTopicName(updatedTenantId, config.getEmailTopic());

            kafkaTemplate.send(updatedTopic, emailRequest);

            log.info("operation = sendCauseListEmail, result = SUCCESS, hearingDate = {}", hearingDate);
        } catch (Exception e) {
            log.error("operation = sendCauseListEmail, result = FAILURE, hearingDate = {}, error = {}", hearingDate, e.getMessage(), e);
            throw new CustomException(ServiceConstants.EMAIL_SEND_ERROR,
                    ServiceConstants.EMAIL_SEND_ERROR_MESSAGE + e.getMessage());
        }
    }
}