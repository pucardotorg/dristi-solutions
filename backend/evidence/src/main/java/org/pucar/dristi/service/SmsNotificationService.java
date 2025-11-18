package org.pucar.dristi.service;

import com.jayway.jsonpath.JsonPath;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class SmsNotificationService {

    private final Configuration config;

    private final Producer producer;

    private final ServiceRequestRepository repository;

    private final DateUtil dateUtil;

    @Autowired
    public SmsNotificationService(Configuration config, Producer producer, ServiceRequestRepository repository, DateUtil dateUtil) {
        this.config = config;
        this.producer = producer;
        this.repository = repository;
        this.dateUtil = dateUtil;
    }

    public void sendNotification(RequestInfo requestInfo, SmsTemplateData smsTemplateData, String notificationStatus, String mobileNumber) {
        try {

            String message = getMessage(requestInfo,smsTemplateData, notificationStatus);
            if (StringUtils.isEmpty(message)) {
                log.info("SMS content has not been configured for this case");
                return;
            }
            pushNotificationBasedOnNotificationStatus(smsTemplateData, notificationStatus, message, mobileNumber);

        } catch (Exception e){
            log.error("Error in Sending Message To Notification Service: " , e);
        }

    }

    private void pushNotificationBasedOnNotificationStatus(SmsTemplateData templateData, String messageCode, String message, String mobileNumber) {

        String templateId = switch (messageCode) {
            case DOCUMENT_SUBMITTED -> config.getSmsNotificationDocumentSubmittedTemplateId();
            default -> null;
        };

        pushNotification(templateData, message, mobileNumber, templateId);
    }

    private void pushNotification(SmsTemplateData templateData, String message, String mobileNumber, String templateId) {
        //get individual name, id, mobileNumber
        log.info("get case e filing number, id, cnr");
        Map<String, String> smsDetails = getDetailsForSMS(templateData, mobileNumber);

        log.info("building Notification Request for case number {}", templateData.getCourtCaseNumber());
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

    private Map<String, String> getDetailsForSMS(SmsTemplateData smsTemplateData, String mobileNumber) {
        Map<String, String> smsDetails = new HashMap<>();

        smsDetails.put("courtCaseNumber", smsTemplateData.getCourtCaseNumber());
        smsDetails.put("cmpNumber", smsTemplateData.getCmpNumber());
        smsDetails.put("tenantId", smsTemplateData.getTenantId());
        smsDetails.put("artifactNumber", smsTemplateData.getArtifactNumber());
        smsDetails.put("mobileNumber", mobileNumber);
        smsDetails.put("filingNumber",smsTemplateData.getFilingNumber());
        smsDetails.put("shortenedUrl", smsTemplateData.getShortenedUrl());

        return smsDetails;
    }


    /**
     * Gets the message from localization
     *
     * @param requestInfo
     * @param templateData
     * @param msgCode
     * @return
     */

    public String getMessage(RequestInfo requestInfo, SmsTemplateData templateData, String msgCode) {
        String rootTenantId = templateData.getTenantId();
        Map<String, Map<String, String>> localizedMessageMap = getLocalisedMessages(requestInfo, rootTenantId,
                NOTIFICATION_ENG_LOCALE_CODE, NOTIFICATION_MODULE_CODE);
        if (localizedMessageMap.isEmpty()) {
            return null;
        }
        return localizedMessageMap.get(NOTIFICATION_ENG_LOCALE_CODE + "|" + rootTenantId).get(msgCode);
    }

    /**
     * Builds msg based on the format
     *
     * @param message
     * @param userDetailsForSMS
     * @return
     */
    public String buildMessage(Map<String, String> userDetailsForSMS, String message) {
        message = message.replace("{{caseId}}", Optional.ofNullable(userDetailsForSMS.get("caseId")).orElse(""))
                .replace("{{efilingNumber}}", Optional.ofNullable(userDetailsForSMS.get("efilingNumber")).orElse(""))
                .replace("{{cnr}}", Optional.ofNullable(userDetailsForSMS.get("cnr")).orElse(""))
                .replace("{{link}}", Optional.ofNullable(userDetailsForSMS.get("link")).orElse(""))
                .replace("{{date}}", Optional.ofNullable(userDetailsForSMS.get("date")).orElse(""))
                .replace("{{cmpNumber}}", getPreferredCaseIdentifier(userDetailsForSMS))
                .replace("{{artifactNumber}}", Optional.ofNullable(userDetailsForSMS.get("artifactNumber")).orElse(""))
                .replace("{{filingNumber}}", getPreferredCaseIdentifier(userDetailsForSMS))
                .replace("{{shortenedUrl}}", Optional.ofNullable(userDetailsForSMS.get("shortenedUrl")).orElse(""));

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

        String filingNumber = userDetailsForSMS.get("filingNumber");
        if (filingNumber != null && !filingNumber.isEmpty()) {
            return filingNumber;
        }
        return "";
    }

    /**
     * Creates a cache for localization that gets refreshed at every call.
     *
     * @param requestInfo
     * @param rootTenantId
     * @param locale
     * @param module
     * @return
     */
    public Map<String, Map<String, String>> getLocalisedMessages(RequestInfo requestInfo, String rootTenantId, String locale, String module) {
        Map<String, Map<String, String>> localizedMessageMap = new HashMap<>();
        Map<String, String> mapOfCodesAndMessages = new HashMap<>();
        StringBuilder uri = new StringBuilder();
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(requestInfo);
        uri.append(config.getLocalizationHost()).append(config.getLocalizationSearchEndpoint())
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

    public void sendEmail(@Valid RequestInfo requestInfo, EmailTemplateData emailTemplateData, String sourceName, String witnessEmail) {
        try {
            if (sourceName == null) {
                log.error("sourceName cannot be null");
            }
            Optional<EmailContent> contentOpt = getEmailContent(emailTemplateData, sourceName);
            if (contentOpt.isEmpty()) {
                log.error("Email content has not been configured");
                return;
            }

            EmailRequest emailRequest = buildEmailRequest(contentOpt.get(), requestInfo, emailTemplateData.getTenantId(), Set.of(witnessEmail));
            producer.push(config.getMailNotificationTopic(), emailRequest);
            log.info("Email sent successfully to {}", sourceName);
        } catch (Exception e) {
            log.error("Error in Sending Message To Notification Service: " , e);
        }
    }

    public EmailRequest buildEmailRequest(EmailContent content, RequestInfo requestInfo, String tenantId, Set<String> recipients) {
        Email email = Email.builder()
                .emailTo(recipients)
                .subject(content.getSubject())
                .body(content.getBody())
                .tenantId(tenantId)
                .templateCode(WITNESS_DEPOSITION_EMAIL)
                .build();

        return EmailRequest.builder()
                .requestInfo(requestInfo)
                .email(email)
                .build();
    }

    private Optional<EmailContent> getEmailContent(EmailTemplateData emailTemplateData, String sourceName) {

        String subjectTemplate = WITNESS_DEPOSITION_EMAIL_SUBJECT;
        String bodyTemplate = WITNESS_DEPOSITION_EMAIL_BODY;

        if (StringUtils.isEmpty(subjectTemplate) || StringUtils.isEmpty(bodyTemplate)) {
            return Optional.empty();
        }
        String subject = buildSubject(subjectTemplate, emailTemplateData);
        String body = buildBody(bodyTemplate, emailTemplateData, sourceName);

        return Optional.of(new EmailContent(subject, body));

    }

    public String buildSubject(String subjectTemplate, EmailTemplateData emailTemplateData){
        String caseName = emailTemplateData.getCaseName();
        return subjectTemplate.replace("{{caseName}}", caseName);
    }

    public String buildBody(String bodyTemplate, EmailTemplateData emailTemplateData, String sourceName) {
        String formattedCurrentDate = dateUtil.getFormattedCurrentDate();

        return bodyTemplate.replace("{{name}}", sourceName)
                .replace("{{caseNumber}}", emailTemplateData.getCaseNumber())
                .replace("{{caseName}}", emailTemplateData.getCaseName())
                .replace("{{date}}", formattedCurrentDate)
                .replace("{{shortenedURL}}", emailTemplateData.getShortenedURL());
    }
}
