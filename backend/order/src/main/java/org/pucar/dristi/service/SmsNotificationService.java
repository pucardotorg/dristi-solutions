package org.pucar.dristi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.web.models.HearingCriteria;
import org.pucar.dristi.web.models.HearingListResponse;
import org.pucar.dristi.web.models.HearingSearchRequest;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.SMSRequest;
import org.pucar.dristi.web.models.SmsTemplateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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

    private final TaskScheduler taskScheduler;

    private final DateUtil dateUtil;

    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public SmsNotificationService(Configuration config, Producer producer, ServiceRequestRepository repository, TaskScheduler taskScheduler, DateUtil dateUtil, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper) {
        this.config = config;
        this.producer = producer;
        this.repository = repository;
        this.taskScheduler = taskScheduler;
        this.dateUtil = dateUtil;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }

    public void sendNotification(RequestInfo requestInfo, SmsTemplateData smsTemplateData, String notificationStatus, String mobileNumber, Order order) {
        try {

            String message = getMessage(requestInfo,smsTemplateData, notificationStatus);
            if (StringUtils.isEmpty(message)) {
                log.info("SMS content has not been configured for this case");
                return;
            }
            pushNotificationBasedOnNotificationStatus(smsTemplateData, notificationStatus, message, mobileNumber, order);

        } catch (Exception e){
            log.error("Error in Sending Message To Notification Service: " , e);
        }

    }

    private boolean wereHearingsScheduledTodayForCase(String filingNumber){
        StringBuilder uri = new StringBuilder();
        uri.append(config.getHearingHost()).append(config.getHearingSearchPath());
        ZoneId zoneId = ZoneId.of(config.getZoneId());
        LocalDate currentDate = LocalDate.now(zoneId);
        Long fromDate = dateUtil.getEPochFromLocalDate(currentDate);
        HearingCriteria criteria = HearingCriteria.builder()
                .filingNumber(filingNumber)
                .status(SCHEDULED)
                .fromDate(fromDate)
                .build();
        HearingSearchRequest request = HearingSearchRequest.builder()
                .criteria(criteria)
                .build();

        Object response = serviceRequestRepository.fetchResult(uri, request);
        HearingListResponse hearingListResponse = objectMapper.convertValue(response, new TypeReference<>(){});

        return !hearingListResponse.getHearingList().isEmpty();
    }

    private boolean isProcessOrder(String orderType){
        return SUMMONS.equalsIgnoreCase(orderType) ||
                WARRANT.equalsIgnoreCase(orderType) ||
                NOTICE.equalsIgnoreCase(orderType) ||
                PROCLAMATION.equalsIgnoreCase(orderType) ||
                ATTACHMENT.equalsIgnoreCase(orderType);
    }

    private boolean shouldSendNotificationForOrderIssued(Order order){

        return isProcessOrder(order.getOrderType()) ||
                !wereHearingsScheduledTodayForCase(order.getFilingNumber());

    }

    private void pushNotificationBasedOnNotificationStatus(SmsTemplateData templateData, String messageCode, String message, String mobileNumber, Order order) {

        if(messageCode.equalsIgnoreCase(ORDER_ISSUED)){
            if(shouldSendNotificationForOrderIssued(order)){
                Instant instant = dateUtil.getInstantFrom(config.getSmsOrderIssuedTime());
                schedulePushNotification(templateData, message, mobileNumber, config.getSmsNotificationJudgeIssueOrderTemplateId(), instant);
            }
        }
        if(HEARING_SCHEDULED.equalsIgnoreCase(messageCode)){
            Instant instant = dateUtil.getInstantFrom(config.getSmsHearingScheduledTime());
            schedulePushNotification(templateData, message, mobileNumber, config.getSmsNotificationHearingScheduledTemplateId(), instant);
        }
        if(messageCode.equalsIgnoreCase(NOTICE_ISSUED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationNoticeIssuedTemplateId());
        }
        if(messageCode.equalsIgnoreCase(HEARING_RESCHEDULED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationHearingReScheduledTemplateId());
        }
        if(messageCode.equalsIgnoreCase(SUMMONS_ISSUED)){
            pushNotification(templateData, message, mobileNumber, config.getSmsNotificationSummonsIssuedTemplateId());
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
                .locale(ENG_LOCALE_CODE)
                .expiryTime(System.currentTimeMillis() + 60 * 60 * 1000)
                .message(message).build();
        log.info("push message {}", smsRequest);

        producer.push(config.getSmsNotificationTopic(), smsRequest);
    }

    private void schedulePushNotification(SmsTemplateData smsTemplateData, String message, String mobileNumber, String templateId, Instant instant){
        log.info("Scheduling notification for template id {} at time {}", templateId, instant);
        taskScheduler.schedule(() -> pushNotification(smsTemplateData, message, mobileNumber, templateId), instant);
    }

    private Map<String, String> getDetailsForSMS(SmsTemplateData smsTemplateData, String mobileNumber) {
        Map<String, String> smsDetails = new HashMap<>();

        smsDetails.put("courtCaseNumber", smsTemplateData.getCourtCaseNumber());
        smsDetails.put("cmpNumber", smsTemplateData.getCmpNumber());
        smsDetails.put("hearingDate", smsTemplateData.getHearingDate());
        smsDetails.put("tenantId", smsTemplateData.getTenantId());
        smsDetails.put("submissionDate", smsTemplateData.getSubmissionDate());
        smsDetails.put("mobileNumber", mobileNumber);
        smsDetails.put("efilingNumber", smsTemplateData.getFilingNumber());
        smsDetails.put("oldHearingDate", smsTemplateData.getOldHearingDate());

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
                ENG_LOCALE_CODE, NOTIFICATION_MODULE_CODE);
        if (localizedMessageMap.isEmpty()) {
            return null;
        }
        return localizedMessageMap.get(ENG_LOCALE_CODE + "|" + rootTenantId).get(msgCode);
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
                .replace("{{hearingDate}}", Optional.ofNullable(userDetailsForSMS.get("hearingDate")).orElse(""))
                .replace("{{oldHearingDate}}", Optional.ofNullable(userDetailsForSMS.get("oldHearingDate")).orElse(""));
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
            codes = JsonPath.read(result, LOCALIZATION_CODES_JSONPATH);
            messages = JsonPath.read(result, LOCALIZATION_MSGS_JSONPATH);
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
