package pucar.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.User;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.service.SmsNotificationService;
import pucar.util.CaseUtil;
import pucar.util.DateUtil;
import pucar.util.PendingTaskUtil;
import pucar.util.UserUtil;
import pucar.web.models.SMSTemplateData;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseListResponse;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.pendingtask.InboxRequest;
import pucar.web.models.pendingtask.InboxSearchCriteria;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.ProcessInstanceSearchCriteria;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;

import static pucar.config.ServiceConstants.MAKE_MANDATORY_SUBMISSION;
import static pucar.config.ServiceConstants.MANDATORY_SUBMISSION_PENDING;
import static pucar.config.ServiceConstants.PAYMENT_PENDING_FOR_ATTACHMENT;
import static pucar.config.ServiceConstants.PAYMENT_PENDING_FOR_PROCLAMATION;
import static pucar.config.ServiceConstants.PAYMENT_PENDING_FOR_WARRANT;
import static pucar.config.ServiceConstants.PROCESS_FEE_PAYMENT_PENDING;
import static pucar.config.ServiceConstants.RPAD;
import static pucar.config.ServiceConstants.RPAD_SUBMISSION_PENDING;

@Component
@Slf4j
@EnableScheduling
public class CronJobScheduler {

    private final PendingTaskUtil pendingTaskUtil;
    private final Configuration config;
    private final UserUtil userUtil;
    private final SmsNotificationService smsNotificationService;
    private final DateUtil dateUtil;
    private final CaseUtil caseUtil;

    public CronJobScheduler(PendingTaskUtil pendingTaskUtil, Configuration config, UserUtil userUtil, SmsNotificationService smsNotificationService, DateUtil dateUtil, CaseUtil caseUtil) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.config = config;
        this.userUtil = userUtil;
        this.smsNotificationService = smsNotificationService;
        this.dateUtil = dateUtil;
        this.caseUtil = caseUtil;
    }

    public void sendNotificationForProcessPaymentPending() {
        log.info("Starting Cron Job for sending process payment pending notifications");
        List<PendingTask> pendingTasks = getPendingTasks();
        SMSTemplateData smsTemplateData = SMSTemplateData.builder().build();
        pendingTasks.stream()
                .filter(this::isPendingTaskForPaymentPending)
                .filter(pendingTask -> isThirdDaySinceCreatedTime(pendingTask.getCreatedTime()))
                .forEach(pendingTask -> {
                    List<String> userUuids = pendingTask.getAssignedTo().stream().
                            map(User::getUuid)
                            .toList();
                    List<User> users = userUtil.getUserListFromUserUuid(userUuids);
                    users.forEach(user -> {
                        smsNotificationService.sendNotification(null, smsTemplateData, PROCESS_FEE_PAYMENT_PENDING, user.getMobileNumber());
                    });
                    if(pendingTask.getName().contains(RPAD)) {
                        // Set in pendingTaskUtil.getPendingTaskNameForSummonAndNotice()
                        users.forEach(user -> {
                            smsNotificationService.sendNotification(null, smsTemplateData, RPAD_SUBMISSION_PENDING, user.getMobileNumber());
                        });
                    }
                });

    }

    public boolean isPendingTaskForPaymentPending(PendingTask pendingTask) {
        // Set in pendingTaskUtil.getPendingTaskNameForSummonAndNotice() for Notice and Summons and
        // from Service Constants for others
        return pendingTask.getName().contains("Make Payment") ||
                pendingTask.getName().contains("Pay online") ||
                pendingTask.getName().equalsIgnoreCase(PAYMENT_PENDING_FOR_WARRANT) ||
                pendingTask.getName().equalsIgnoreCase(PAYMENT_PENDING_FOR_ATTACHMENT) ||
                pendingTask.getName().equalsIgnoreCase(PAYMENT_PENDING_FOR_PROCLAMATION);
    }

    public boolean isThirdDaySinceCreatedTime(long createdTime) {

        Instant currentTime = Instant.now();
        Instant createdInstant = Instant.ofEpochMilli(createdTime);
        long threeDaysInMillis = Duration.ofDays(3).toMillis();

        // Get the time difference in milliseconds from createdTime
        long timeSinceCreation = Duration.between(createdInstant, currentTime).toMillis();

        // Find the closest multiple of 3 days (72 hours)
        long nextTriggerTimeMillis = (timeSinceCreation / threeDaysInMillis) * threeDaysInMillis + threeDaysInMillis;

        // Calculate the ±6 hours window around the next trigger time
        long toleranceMillis = Duration.ofHours(6).toMillis();
        long windowStartMillis = nextTriggerTimeMillis - toleranceMillis;
        long windowEndMillis = nextTriggerTimeMillis + toleranceMillis;

        // Check if the current time is within the tolerance window around the next trigger time
        return currentTime.toEpochMilli() >= windowStartMillis && currentTime.toEpochMilli() <= windowEndMillis;
    }

    public void sendNotificationForMandatorySubmissionPending() {
        List<PendingTask> pendingTasks = getPendingTasksForMandatorySubmission();
        SMSTemplateData smsTemplateData = SMSTemplateData.builder().build();
        pendingTasks.stream()
                .filter(pendingTask -> isThirdDaySinceCreatedTime(pendingTask.getCreatedTime()))
                .forEach(pendingTask -> {
                    CaseCriteria criteria = CaseCriteria.builder()
                            .filingNumber(pendingTask.getFilingNumber())
                            .build();
                    CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                            .criteria(List.of(criteria))
                            .build();
                    CaseListResponse caseListResponse = caseUtil.searchCaseDetails(caseSearchRequest);
                    CourtCase courtCase = caseListResponse.getCriteria().get(0).getResponseList().get(0);
                    String courtCaseNumber = courtCase.getCourtCaseNumber();
                    String cmpNumber = courtCase.getCmpNumber();
                    smsTemplateData.setCmpNumber(cmpNumber);
                    smsTemplateData.setCourtCaseNumber(courtCaseNumber);
                    LocalDate date = dateUtil.getLocalDateFromEpoch(pendingTask.getStateSla());
                    smsTemplateData.setSubmissionDueDate(String.valueOf(date));
                    List<String> userUuids = pendingTask.getAssignedTo().stream().
                            map(User::getUuid)
                            .toList();
                    List<User> users = userUtil.getUserListFromUserUuid(userUuids);
                    users.forEach(user -> {
                        smsNotificationService.sendNotification(null, smsTemplateData, MANDATORY_SUBMISSION_PENDING, user.getMobileNumber());
                    });
                });

    }

    List<PendingTask> getPendingTasks() {
        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("isCompleted", false);

        InboxRequest searchRequest = InboxRequest.builder()
                .inbox(
                        InboxSearchCriteria.builder()
                            .tenantId(config.getStateLevelTenantId())
                            .processSearchCriteria(
                                ProcessInstanceSearchCriteria.builder()
                                    .moduleName("Pending Tasks Service")
                                    .businessService(List.of("hearing-default"))
                                    .build()
                        )
                        .moduleSearchCriteria(moduleSearchCriteria)
                        .build()
                ).
                build();
        return pendingTaskUtil.getPendingTask(searchRequest);
    }

    List<PendingTask> getPendingTasksForMandatorySubmission() {
        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("name", MAKE_MANDATORY_SUBMISSION);
        moduleSearchCriteria.put("isCompleted", false);

        InboxRequest searchRequest = InboxRequest.builder()
                .inbox(
                        InboxSearchCriteria.builder()
                                .tenantId(config.getStateLevelTenantId())
                                .processSearchCriteria(
                                        ProcessInstanceSearchCriteria.builder()
                                                .moduleName("Pending Tasks Service")
                                                .businessService(List.of("hearing-default"))
                                                .build()
                                )
                                .moduleSearchCriteria(moduleSearchCriteria)
                                .limit(300)
                                .offset(0)
                                .build()
                ).
                build();
        return pendingTaskUtil.getPendingTask(searchRequest);
    }



}
