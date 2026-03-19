package digit.service;

import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.kafka.Producer;
import digit.repository.ServiceRequestRepository;
import digit.web.SMSRequest;
import digit.web.models.SMSTemplateData;
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

import static digit.config.ServiceConstants.NOTIFICATION_ENG_LOCALE_CODE;
import static digit.config.ServiceConstants.NOTIFICATION_LOCALIZATION_CODES_JSONPATH;
import static digit.config.ServiceConstants.NOTIFICATION_LOCALIZATION_MSGS_JSONPATH;
import static digit.config.ServiceConstants.NOTIFICATION_MODULE_CODE;
import static digit.config.ServiceConstants.RPAD_SUBMISSION;

@Service
@Slf4j
public class SmsNotificationService {

    private final Configuration config;

    private final Producer producer;

    private final ServiceRequestRepository repository;

    @Autowired
    public SmsNotificationService(Configuration config, Producer producer, ServiceRequestRepository repository) {
        this.config = config;
        this.producer = producer;
        this.repository = repository;
    }

    public void sendNotification(RequestInfo requestInfo, SMSTemplateData smsTemplateData, String notificationStatus, String mobileNumber) {
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

    private void pushNotificationBasedOnNotificationStatus(SMSTemplateData templateData, String messageCode, String message, String mobileNumber) {
        String templateId = switch (messageCode) {
            case RPAD_SUBMISSION -> config.getSmsNotificationRpadSubmissionTemplateId();
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
        smsDetails.put("days", smsTemplateData.getDays());

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

    public String getMessage(RequestInfo requestInfo, SMSTemplateData templateData, String msgCode) {
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
        message = message
                .replace("{{cmpNumber}}", getPreferredCaseIdentifier(userDetailsForSMS))
                .replace("{{days}}", Optional.ofNullable(userDetailsForSMS.get("days")).orElse(""));

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
}
