package pucar.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.service.SmsNotificationService;
import pucar.util.CaseUtil;
import pucar.util.DateUtil;
import pucar.util.PendingTaskUtil;
import pucar.util.RequestInfoGenerator;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static pucar.config.ServiceConstants.*;

@Slf4j
@Component
@EnableScheduling
public class CronJobScheduler {

    private final ZoneId ZONE_ID;

    private final PendingTaskUtil pendingTaskUtil;
    private final Configuration config;
    private final UserUtil userUtil;
    private final SmsNotificationService smsNotificationService;
    private final DateUtil dateUtil;
    private final CaseUtil caseUtil;
    private final RequestInfoGenerator requestInfoGenerator;

    public CronJobScheduler(PendingTaskUtil pendingTaskUtil,
                            Configuration config,
                            UserUtil userUtil,
                            SmsNotificationService smsNotificationService,
                            DateUtil dateUtil,
                            CaseUtil caseUtil,
                            RequestInfoGenerator requestInfoGenerator) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.config = config;
        this.userUtil = userUtil;
        this.smsNotificationService = smsNotificationService;
        this.dateUtil = dateUtil;
        this.caseUtil = caseUtil;
        this.requestInfoGenerator = requestInfoGenerator;
        this.ZONE_ID = ZoneId.of(config.getZoneId());
    }

    public void sendNotificationForProcessPaymentPending() {
        log.info("Starting cron job for process payment pending notifications");

        try {
            List<PendingTask> pendingTasks = getPendingTasksForPaymentPending();
            log.info("Found {} pending tasks for payment", pendingTasks.size());

            SMSTemplateData smsTemplateData = SMSTemplateData.builder()
                    .tenantId(config.getStateLevelTenantId())
                    .build();
            LocalDate today = LocalDate.now(ZONE_ID);
            log.debug("Current date in {}: {}", ZONE_ID, today);

            int processedCount = 0;
            int skippedCount = 0;

            for (PendingTask task : pendingTasks) {
                if (task.getCreatedTime() == null) {
                    log.warn("Skipping task with null createdTime: {}", task.getId());
                    skippedCount++;
                    continue;
                }

                if (isCreatedToday(task.getCreatedTime(), today)) {
                    log.debug("Skipping task {} - created today", task.getId());
                    skippedCount++;
                    continue;
                }

                try {
                    sendPaymentNotifications(task, smsTemplateData);
                    processedCount++;
                    log.debug("Sent notification for task: {}", task.getId());
                } catch (Exception e) {
                    log.error("Failed to send payment notification for task: {}", task.getId(), e);
                }
            }

            log.info("Completed process payment notifications - Processed: {}, Skipped: {}",
                    processedCount, skippedCount);
        } catch (Exception e) {
            log.error("Error in sendNotificationForProcessPaymentPending", e);
        }
    }

    private List<PendingTask> getPendingTasksForPaymentPending() {
        List<String> pendingTaskNames = List.of(
                "Make Payment",
                "Pay online",
                PAYMENT_PENDING_FOR_WARRANT,
                PAYMENT_PENDING_FOR_PROCLAMATION,
                PAYMENT_PENDING_FOR_ATTACHMENT
        );

        List<PendingTask> allPendingTasks = new ArrayList<>();

        for (String taskName : pendingTaskNames) {
            try {
                log.debug("Fetching pending tasks for: {}", taskName);
                InboxRequest searchRequest = createInboxRequest(taskName);
                List<PendingTask> tasks = pendingTaskUtil.getPendingTask(searchRequest);

                if (tasks != null && !tasks.isEmpty()) {
                    log.debug("Found {} tasks for {}", tasks.size(), taskName);
                    allPendingTasks.addAll(tasks);
                } else {
                    log.debug("No tasks found for {}", taskName);
                }
            } catch (Exception e) {
                log.error("Error fetching tasks for {}", taskName, e);
            }
        }

        return allPendingTasks;
    }

    private boolean isCreatedToday(long createdTime, LocalDate today) {
        Instant createdInstant = Instant.ofEpochMilli(createdTime);
        LocalDate createdDate = createdInstant.atZone(ZONE_ID).toLocalDate();
        boolean result = createdDate.equals(today);

        if (log.isTraceEnabled()) {
            log.trace("isCreatedToday check - createdDate: {}, today: {}, result: {}",
                    createdDate, today, result);
        }

        return result;
    }

    private void sendPaymentNotifications(PendingTask pendingTask, SMSTemplateData smsTemplateData) {
        log.debug("Sending payment notifications for task: {} ({})",
                pendingTask.getId(), pendingTask.getName());

        Set<User> users = new HashSet<>(getUsersFromPendingTask(pendingTask));
        log.debug("Found {} users for task {}", users.size(), pendingTask.getId());

        int sentCount = 0;
        for (User user : users) {
            try {
                smsNotificationService.sendNotification(null, smsTemplateData,
                        PROCESS_FEE_PAYMENT_PENDING,
                        user.getMobileNumber());
                sentCount++;
            } catch (Exception e) {
                log.error("Failed to send notification to user {}", user.getUuid(), e);
            }
        }
        log.debug("Sent {} payment notifications for task {}", sentCount, pendingTask.getId());

        if (pendingTask.getName().contains(RPAD)) {
            log.debug("Task {} is RPAD type, sending additional notifications", pendingTask.getId());
            int rpadSentCount = 0;
            for (User user : users) {
                try {
                    smsNotificationService.sendNotification(null, smsTemplateData,
                            RPAD_SUBMISSION_PENDING,
                            user.getMobileNumber());
                    rpadSentCount++;
                } catch (Exception e) {
                    log.error("Failed to send RPAD notification to user {}", user.getUuid(), e);
                }
            }
            log.debug("Sent {} RPAD notifications for task {}", rpadSentCount, pendingTask.getId());
        }
    }

    public void sendNotificationForMandatorySubmissionPending() {
        log.info("Starting cron job for mandatory submission pending notifications");

        try {
            List<PendingTask> pendingTasks = getPendingTasksForMandatorySubmission();
            log.info("Found {} pending tasks for mandatory submission", pendingTasks.size());

            SMSTemplateData smsTemplateData = SMSTemplateData.builder()
                    .tenantId(config.getStateLevelTenantId())
                    .build();
            LocalDate today = LocalDate.now(ZONE_ID);
            log.debug("Current date in {}: {}", ZONE_ID, today);

            int processedCount = 0;
            int skippedCount = 0;

            for (PendingTask task : pendingTasks) {
                if (task.getCreatedTime() == null) {
                    log.warn("Skipping task with null createdTime: {}", task.getId());
                    skippedCount++;
                    continue;
                }

                boolean isThirdDay = isMultipleOfThreeDaysSinceCreation(task.getCreatedTime());
                log.debug("Task {} - Days since creation check: {}", task.getId(), isThirdDay);

                if (!isThirdDay) {
                    skippedCount++;
                    continue;
                }

                try {
                    sendMandatorySubmissionNotification(task, smsTemplateData);
                    processedCount++;
                    log.debug("Sent mandatory submission notification for task: {}", task.getId());
                } catch (Exception e) {
                    log.error("Failed to send mandatory submission notification for task: {}",
                            task.getId(), e);
                }
            }

            log.info("Completed mandatory submission notifications - Processed: {}, Skipped: {}",
                    processedCount, skippedCount);
        } catch (Exception e) {
            log.error("Error in sendNotificationForMandatorySubmissionPending", e);
        }
    }

    private List<PendingTask> getPendingTasksForMandatorySubmission() {
        log.debug("Fetching pending tasks for: {}", MAKE_MANDATORY_SUBMISSION);
        InboxRequest searchRequest = createInboxRequest(MAKE_MANDATORY_SUBMISSION);
        List<PendingTask> tasks = pendingTaskUtil.getPendingTask(searchRequest);

        if (tasks != null) {
            log.debug("Found {} mandatory submission tasks", tasks.size());
        } else {
            log.debug("No mandatory submission tasks found");
            return new ArrayList<>();
        }

        return tasks;
    }

    private boolean isMultipleOfThreeDaysSinceCreation(long createdTime) {
        Instant createdInstant = Instant.ofEpochMilli(createdTime);
        LocalDate createdDate = createdInstant.atZone(ZONE_ID).toLocalDate();
        LocalDate today = LocalDate.now(ZONE_ID);

        long daysBetween = ChronoUnit.DAYS.between(createdDate, today);
        boolean isMultipleOfThree = daysBetween > 0 && daysBetween % 3 == 0;

        log.debug("Third day check - createdDate: {}, today: {}, daysBetween: {}, isThirdDay: {}",
                createdDate, today, daysBetween, isMultipleOfThree);

        return isMultipleOfThree;
    }

    private void sendMandatorySubmissionNotification(PendingTask pendingTask, SMSTemplateData smsTemplateData) {
        log.debug("Processing mandatory submission notification for filing: {}",
                pendingTask.getFilingNumber());

        try {
            CourtCase courtCase = fetchCourtCase(pendingTask.getFilingNumber());
            log.debug("Retrieved court case - CMP: {}, Case Number: {}",
                    courtCase.getCmpNumber(), courtCase.getCourtCaseNumber());

            smsTemplateData.setCmpNumber(courtCase.getCmpNumber());
            smsTemplateData.setCourtCaseNumber(courtCase.getCourtCaseNumber());

            LocalDate submissionDate = dateUtil.getLocalDateFromEpoch(pendingTask.getStateSla());
            smsTemplateData.setSubmissionDueDate(String.valueOf(submissionDate));
            log.debug("Submission due date: {}", submissionDate);

            Set<User> users = new HashSet<>(getUsersFromPendingTask(pendingTask));
            log.debug("Found {} users for filing {}", users.size(), pendingTask.getFilingNumber());

            int sentCount = 0;
            for (User user : users) {
                try {
                    smsNotificationService.sendNotification(null, smsTemplateData,
                            MANDATORY_SUBMISSION_PENDING,
                            user.getMobileNumber());
                    sentCount++;
                } catch (Exception e) {
                    log.error("Failed to send mandatory submission notification to user {}",
                            user.getUuid(), e);
                }
            }
            log.debug("Sent {} mandatory submission notifications for filing {}",
                    sentCount, pendingTask.getFilingNumber());

        } catch (Exception e) {
            log.error("Failed to send mandatory submission notification for filing number: {}",
                    pendingTask.getFilingNumber(), e);
            throw e;
        }
    }

    private CourtCase fetchCourtCase(String filingNumber) {
        log.debug("Fetching court case for filing number: {}", filingNumber);

        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(filingNumber)
                .defaultFields(false)
                .build();

        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(List.of(criteria))
                .build();

        CaseListResponse caseListResponse = caseUtil.searchCaseDetails(caseSearchRequest);
        CourtCase courtCase = caseListResponse.getCriteria().get(0).getResponseList().get(0);

        log.debug("Successfully fetched court case for filing: {}", filingNumber);
        return courtCase;
    }

    private InboxRequest createInboxRequest(String taskName) {
        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("name", taskName);
        moduleSearchCriteria.put("isCompleted", false);

        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Pending Tasks Service")
                .businessService(List.of("hearing-default"))
                .build();

        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .tenantId(config.getStateLevelTenantId())
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .limit(300)
                .offset(0)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    private List<User> getUsersFromPendingTask(PendingTask pendingTask) {
        List<?> assignedToObj = pendingTask.getAssignedTo();

        if (assignedToObj == null) {
            log.warn("No users assigned to task: {}", pendingTask.getId());
            return new ArrayList<>();
        }

        Set<String> userUuids = new HashSet<>();

        if (assignedToObj.isEmpty()) {
            log.warn("Empty assignedTo list for task: {}", pendingTask.getId());
            return new ArrayList<>();
        }

        userUuids = assignedToObj.stream()
                .map(assignedUser -> {
                    if (assignedUser instanceof User) {
                        return ((User) assignedUser).getUuid();
                    } else if (assignedUser instanceof LinkedHashMap) {
                        @SuppressWarnings("unchecked")
                        LinkedHashMap<String, Object> userMap = (LinkedHashMap<String, Object>) assignedUser;
                        return (String) userMap.get("uuid");
                    } else {
                        log.warn("Unexpected assignedTo element type: {}", assignedUser.getClass().getName());
                        return null;
                    }
                })
                .filter(uuid -> uuid != null)
                .collect(Collectors.toSet());

        if (userUuids.isEmpty()) {
            log.warn("No valid user UUIDs extracted for task: {}", pendingTask.getId());
            return new ArrayList<>();
        }

        log.debug("Fetching {} users for task {}", userUuids.size(), pendingTask.getId());
        return userUtil.getUserListFromUserUuid(new ArrayList<>(userUuids));
    }
}
