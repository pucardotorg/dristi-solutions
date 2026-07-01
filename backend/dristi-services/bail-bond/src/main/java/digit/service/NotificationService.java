package digit.service;

import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.kafka.Producer;
import digit.repository.ServiceRequestRepository;
import digit.util.DateUtil;
import digit.web.models.BailRequest;
import digit.web.models.Email;
import digit.web.models.EmailRecipientData;
import digit.web.models.EmailTemplateData;
import digit.web.models.EmailContent;
import digit.web.models.EmailRequest;
import digit.web.models.SMSRequest;
import digit.web.models.SmsTemplateData;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class NotificationService {

    private final Configuration config;

    private final Producer producer;

    private final ServiceRequestRepository repository;

    private final DateUtil dateUtil;

    @Autowired
    public NotificationService(Configuration config, Producer producer, ServiceRequestRepository repository, DateUtil dateUtil) {
        this.config = config;
        this.producer = producer;
        this.repository = repository;
        this.dateUtil = dateUtil;
    }

    public void sendNotification(RequestInfo requestInfo, SmsTemplateData smsTemplateData, String notificationStatus, String mobileNumber) {
        try {

            String message = getMessage(requestInfo,smsTemplateData.getTenantId(), notificationStatus);
            if (StringUtils.isEmpty(message)) {
                log.info("SMS content has not been configured for this case");
                return;
            }
            pushNotificationBasedOnNotificationStatus(smsTemplateData, notificationStatus, message, mobileNumber);

        } catch (Exception e){
            log.error("Error in Sending Message To Notification Service: " , e);
        }

    }

    public Optional<EmailContent> getEmailContent(RequestInfo requestInfo, EmailTemplateData emailTemplateData, EmailRecipientData recipientData) {
        String tenantId = emailTemplateData.getTenantId();
        String subjectTemplate = BAIL_BOND_SIGNATURE_SUBJECT;
        String bodyTemplate = BAIL_BOND_SIGNATURE_BODY;

        if (StringUtils.isEmpty(subjectTemplate) || StringUtils.isEmpty(bodyTemplate)) {
            return Optional.empty();
        }
        String subject = buildSubject(subjectTemplate, emailTemplateData, recipientData);
        String body = buildBody(bodyTemplate, emailTemplateData, recipientData);

        return Optional.of(new EmailContent(subject, body));
    }

    public EmailRequest buildEmailRequest(EmailContent content, RequestInfo requestInfo, String tenantId, Set<String> recipients) {
        Email email = Email.builder()
                .emailTo(recipients)
                .subject(content.getSubject())
                .body(content.getBody())
                .tenantId(tenantId)
                .templateCode(BAIL_BOND_TEMPLATE_CODE)
                .build();

        return EmailRequest.builder()
                .requestInfo(requestInfo)
                .email(email)
                .build();
    }


    public void sendEmail(BailRequest bailRequest, EmailTemplateData emailTemplateData, EmailRecipientData recipientData) {
        try {
            RequestInfo requestInfo = bailRequest.getRequestInfo();
            String tenantId = emailTemplateData.getTenantId();
            String emailId = recipientData.getEmail();

            Optional<EmailContent> contentOpt = getEmailContent(requestInfo, emailTemplateData, recipientData);
            if (contentOpt.isEmpty()) {
                log.error("Email content has not been configured");
                return;
            }

            EmailRequest emailRequest = buildEmailRequest(contentOpt.get(), requestInfo, tenantId, Set.of(emailId));
            producer.push(config.getMailNotificationTopic(), emailRequest);
            log.info("Email sent successfully to {}", recipientData.getName());

        } catch (Exception e) {
            log.error("Error in Sending Email: ", e);
        }
    }

    public String getAsValueForPerson(String person){
        return switch (person){
            case LITIGANT -> "as Accused";
            case SURETY -> "as Surety";
            case ADVOCATE -> "";
            default -> throw new IllegalStateException("Unexpected value: " + person);
        };
    }


    public String buildSubject(String subjectTemplate, EmailTemplateData emailTemplateData, EmailRecipientData recipientData){
        String person = recipientData.getType();
        String asValue = getAsValueForPerson(person);
        String caseName = emailTemplateData.getCaseName();
        return subjectTemplate.replace("{{as}}", asValue)
                    .replace("{{caseName}}", caseName);
    }

    public String buildBody(String bodyTemplate, EmailTemplateData emailTemplateData, EmailRecipientData recipientData){
        String formattedCurrentDate = dateUtil.getFormattedCurrentDate();

        return bodyTemplate.replace("{{name}}", recipientData.getName())
                .replace("{{caseNumber}}", emailTemplateData.getCaseNumber())
                .replace("{{caseName}}", emailTemplateData.getCaseName())
                .replace("{{as}}", getAsValueForPerson(recipientData.getType()))
                .replace("{{date}}", formattedCurrentDate)
                .replace("{{shortenedURL}}", emailTemplateData.getShortenedURL());
    }

    public String getMessage(RequestInfo requestInfo, String rootTenantId, String msgCode) {
        Map<String, Map<String, String>> localizedMessageMap = getLocalisedMessages(requestInfo, rootTenantId,
                NOTIFICATION_ENG_LOCALE_CODE, NOTIFICATION_MODULE_CODE);
        if (localizedMessageMap.isEmpty()) {
            return null;
        }
        return localizedMessageMap.get(NOTIFICATION_ENG_LOCALE_CODE + "|" + rootTenantId).get(msgCode);
    }

    private void pushNotificationBasedOnNotificationStatus(SmsTemplateData smsTemplateData, String messageCode, String message, String mobileNumber) {

        if(messageCode.equalsIgnoreCase(BAIL_BOND_INITIATED_SURETY)){
            pushNotification(smsTemplateData, message, mobileNumber, config.getBailCreatedSmsForSurety());
        }
        if (messageCode.equalsIgnoreCase(BAIL_BOND_INITIATED_LITIGANT)) {
            pushNotification(smsTemplateData, message, mobileNumber, config.getBailCreatedSmsForLitigant());
        }
    }

    public Map<String, Map<String, String>> getLocalisedMessages(RequestInfo requestInfo, String rootTenantId, String locale, String module) {
        Map<String, Map<String, String>> localizedMessageMap = new HashMap<>();
        Map<String, String> mapOfCodesAndMessages = new HashMap<>();
        StringBuilder uri = new StringBuilder();
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(requestInfo);
        uri.append(config.getLocalizationHost()).append(config.getLocalizationContextPath()).append(config.getLocalizationSearchEndpoint())
                .append("?tenantId=" + rootTenantId).append("&module=" + module).append("&locale=" + locale);
        List<String> codes = null;
        List<String> messages = null;
        Object result = null;
        try {
            result = repository.fetchResult(uri, requestInfoWrapper);
            codes = JsonPath.read(result, NOTIFICATION_LOCALIZATION_CODES_JSONPATH);
            messages = JsonPath.read(result, NOTIFICATION_LOCALIZATION_MSGS_JSONPATH);
        } catch (Exception e) {
            log.error("Exception while fetching from localization: " + e);
        }
        if (null != result) {
            for (int i = 0; i < codes.size(); i++) {
                mapOfCodesAndMessages.put(codes.get(i), messages.get(i));
            }
            localizedMessageMap.put(locale + "|" + rootTenantId, mapOfCodesAndMessages);
        }

        return localizedMessageMap;
    }

    private void pushNotification(SmsTemplateData templateData, String message, String mobileNumber, String templateId) {
        //get individual name, id, mobileNumber
        log.info("get case e filing number, id, cnr");
        Map<String, String> smsDetails = getDetailsForSMS(templateData, mobileNumber);

        log.info("building Notification Request for case number {}", templateData.getCmpNumber());
        message = buildMessage(smsDetails, message);
        SMSRequest smsRequest = SMSRequest.builder()
                .mobileNumber(smsDetails.get("mobileNumber"))
                .tenantId(smsDetails.get("tenantId"))
                .templateId(templateId)
                .contentType("TEXT")
                .category("NOTIFICATION")
                .locale(NOTIFICATION_ENG_LOCALE_CODE)
                .expiryTime(System.currentTimeMillis() + 60 * 60 * 1000)
                .message(message).build();
        log.info("push message {}", smsRequest);

        producer.push(config.getSmsNotificationTopic(), smsRequest);
    }

    public String buildMessage(Map<String, String> userDetailsForSMS, String message) {
        message = message.replace("{{courtCaseNumber}}", getPreferredCaseIdentifier(userDetailsForSMS))
                .replace("{{shortenedUrl}}",Optional.ofNullable(userDetailsForSMS.get("shortenedUrl")).orElse(""));
        return message;
    }

    private String getPreferredCaseIdentifier(Map<String, String> userDetailsForSMS) {
        String courtCaseNumber = userDetailsForSMS.get("courtCaseNumber");
        if (courtCaseNumber != null && !courtCaseNumber.isEmpty()) {
            return courtCaseNumber;
        }

        String cmpNumber = userDetailsForSMS.get("cmpNumber");
        if (cmpNumber != null && !cmpNumber.isEmpty()) {
            return cmpNumber;
        }

        return "";
    }

    private Map<String, String> getDetailsForSMS(SmsTemplateData smsTemplateData, String mobileNumber) {
        Map<String, String> smsDetails = new HashMap<>();

        smsDetails.put("courtCaseNumber", smsTemplateData.getCourtCaseNumber());
        smsDetails.put("cmpNumber", smsTemplateData.getCmpNumber());
        smsDetails.put("tenantId", smsTemplateData.getTenantId());
        smsDetails.put("mobileNumber", mobileNumber);
        smsDetails.put("shortenedUrl", smsTemplateData.getShortenedUrl());

        return smsDetails;
    }


}
