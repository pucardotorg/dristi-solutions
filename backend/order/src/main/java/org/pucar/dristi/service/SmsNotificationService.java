package org.pucar.dristi.service;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.SMSRequest;
import org.pucar.dristi.web.models.SmsTemplateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.pucar.dristi.config.ServiceConstants.*;

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

//        if(messageCode.equalsIgnoreCase(ADMISSION_HEARING_SCHEDULED)){
//            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationAdmissionHearingScheduledTemplateId());
//        }
        if(messageCode.equalsIgnoreCase(ORDER_ISSUED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationJudgeIssueOrderTemplateId());
        }
        if(messageCode.equalsIgnoreCase(NOTICE_ISSUED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationNoticeIssuedTemplateId());
        }
        if(messageCode.equalsIgnoreCase(WARRANT_ISSUED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationWarrantIssuedTemplateId());
        }
        if(messageCode.equalsIgnoreCase(HEARING_RESCHEDULED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationHearingReScheduledTemplateId());
        }
        if(messageCode.equalsIgnoreCase(SUMMONS_ISSUED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationSummonsIssuedTemplateId());
        }
        if(messageCode.equalsIgnoreCase(ORDER_PUBLISHED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationOrderPublishedTemplateId());
        }
        if(messageCode.equalsIgnoreCase(EVIDENCE_REQUESTED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationEvidenceRequestedTemplateId());
        }
        if(messageCode.equalsIgnoreCase(NEXT_HEARING_SCHEDULED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationNextHearingScheduledTemplateId());
        }
//        if(messageCode.equalsIgnoreCase(EXAMINATION_UNDER_S351_BNSS_SCHEDULED)){
//            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationExaminationUnderS351BNSSScheduledTemplateId());
//        }
//        if(messageCode.equalsIgnoreCase(EVIDENCE_ACCUSED_PUBLISHED)){
//            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationEvidenceAccusedPublishedTemplateId());
//        }
//        if(messageCode.equalsIgnoreCase(EVIDENCE_COMPLAINANT_PUBLISHED)){
//            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationEvidenceComplainantPublishedTemplateId());
//        }
//        if(messageCode.equalsIgnoreCase(APPEARANCE_PUBLISHED)){
//            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationAppearancePublishedTemplateId());
//        }
        if(messageCode.equalsIgnoreCase(CASE_DECISION_AVAILABLE)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationCaseDecisionAvailableTemplateId());
        }
        if (messageCode.equalsIgnoreCase(ADDITIONAL_INFORMATION_MESSAGE)) {
            pushNotification(templateData,message,mobileNumber,config.getSmsNotificationAdditionalDetails());
        }
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
        smsDetails.put("hearingDate", smsTemplateData.getHearingDate());
        smsDetails.put("tenantId", smsTemplateData.getTenantId());
        smsDetails.put("submissionDate", smsTemplateData.getSubmissionDate());
        smsDetails.put("mobileNumber", mobileNumber);

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
                .replace("{{submissionDate}}", Optional.ofNullable(userDetailsForSMS.get("submissionDate")).orElse(""))
                .replace("{{cmpNumber}}",getPreferredCaseIdentifier(userDetailsForSMS))
                .replace("{{hearingDate}}", Optional.ofNullable(userDetailsForSMS.get("hearingDate")).orElse(""));
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
}
