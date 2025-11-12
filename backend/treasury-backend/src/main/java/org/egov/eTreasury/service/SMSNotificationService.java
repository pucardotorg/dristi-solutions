package org.egov.eTreasury.service;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.kafka.Producer;
import org.egov.eTreasury.model.SMSRequest;
import org.egov.eTreasury.model.SMSTemplateData;
import org.egov.eTreasury.repository.ServiceRequestRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.egov.eTreasury.config.ServiceConstants.NOTIFICATION_ENG_LOCALE_CODE;
import static org.egov.eTreasury.config.ServiceConstants.NOTIFICATION_LOCALIZATION_CODES_JSONPATH;
import static org.egov.eTreasury.config.ServiceConstants.NOTIFICATION_LOCALIZATION_MSGS_JSONPATH;
import static org.egov.eTreasury.config.ServiceConstants.NOTIFICATION_MODULE_CODE;
import static org.egov.eTreasury.config.ServiceConstants.PAYMENT_COMPLETED_SUCCESSFULLY;

@Slf4j
@Service
public class SMSNotificationService {

    private final Producer producer;
    private final PaymentConfiguration config;
    private final ServiceRequestRepository repository;

    public SMSNotificationService(Producer producer, PaymentConfiguration config, ServiceRequestRepository repository) {
        this.producer = producer;
        this.config = config;
        this.repository = repository;
    }

    public void sendNotification(RequestInfo requestInfo, SMSTemplateData smsTemplateData, String messageCode, String mobileNumber) {
        try {

            String message = getMessage(requestInfo,smsTemplateData, messageCode);
            if (StringUtils.isEmpty(message)) {
                log.info("SMS content has not been configured for this case");
                return;
            }
            pushNotificationBasedOnNotificationStatus(smsTemplateData, messageCode, message, mobileNumber);

        } catch (Exception e){
            log.error("Error in Sending Message To Notification Service: " , e);
        }

    }

    public String getMessage(RequestInfo requestInfo, SMSTemplateData templateData, String msgCode) {
        String rootTenantId = templateData.getTenantId();
        Map<String, Map<String, String>> localizedMessageMap = getLocalisedMessages(requestInfo, rootTenantId,
                NOTIFICATION_ENG_LOCALE_CODE, NOTIFICATION_MODULE_CODE) ;
        if (localizedMessageMap.isEmpty()) {
            return null;
        }
        return localizedMessageMap.get(NOTIFICATION_ENG_LOCALE_CODE + "|" + rootTenantId).get(msgCode);
    }

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

    private void pushNotificationBasedOnNotificationStatus(SMSTemplateData templateData, String messageCode, String message, String mobileNumber) {

        String templateId = switch (messageCode) {
            case PAYMENT_COMPLETED_SUCCESSFULLY -> config.getSmsNotificationPaymentCompletedTemplateId();
            default -> null;
        };

        pushNotification(templateData, message, mobileNumber, templateId);
    }

    private void pushNotification(SMSTemplateData templateData, String message, String mobileNumber, String templateId) {
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

    private Map<String, String> getDetailsForSMS(SMSTemplateData smsTemplateData, String mobileNumber) {
        Map<String, String> smsDetails = new HashMap<>();

        smsDetails.put("courtCaseNumber", smsTemplateData.getCourtCaseNumber());
        smsDetails.put("cmpNumber", smsTemplateData.getCmpNumber());
        smsDetails.put("tenantId", smsTemplateData.getTenantId());
        smsDetails.put("mobileNumber", mobileNumber);

        return smsDetails;
    }

    public String buildMessage(Map<String, String> userDetailsForSMS, String message) {
        message = message.replace("{{caseId}}", Optional.ofNullable(userDetailsForSMS.get("caseId")).orElse(""))
                .replace("{{cmpNumber}}", getPreferredCaseIdentifier(userDetailsForSMS))
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
}
