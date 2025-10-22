package org.pucar.dristi.scheduling;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.service.NotificationService;
import org.pucar.dristi.service.WorkflowService;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.Party;
import org.pucar.dristi.web.models.ProcessInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.pucar.dristi.config.ServiceConstants.CASE_REASSIGNED;
import static org.pucar.dristi.config.ServiceConstants.ERRORS_PENDING;

@Component
@Slf4j
@EnableScheduling
public class CronJobScheduler {

    private final CaseRepository caseRepository;
    private final RequestInfoGenerator requestInfoGenerator;
    private final NotificationService notificationService;
    private final Configuration config;
    private final ExecutorService executorService;
    private final WorkflowService workflowService;

    @Autowired
    public CronJobScheduler(CaseRepository caseRepository, RequestInfoGenerator requestInfoGenerator,
                            NotificationService notificationService, Configuration config, WorkflowService workflowService) {
        this.caseRepository = caseRepository;
        this.requestInfoGenerator = requestInfoGenerator;
        this.notificationService = notificationService;
        this.config = config;
        this.executorService = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        this.workflowService = workflowService;
    }

    @Async
    @Scheduled(cron = "${config.case.esign.pending}", zone = "Asia/Kolkata")
    public void sendNotificationToESignPending() {
        if (config.getIsSMSEnabled()) {
            log.info("Starting Cron Job For Sending Notification To Litigant ESign Pending");
            processNotifications("DRAFT_IN_PROGRESS", ServiceConstants.ESIGN_PENDING);

            log.info("Starting Cron Job For Sending Notification To Advocate ESign Pending");
            processNotifications("DRAFT_IN_PROGRESS", ServiceConstants.ADVOCATE_ESIGN_PENDING);
        }
    }

    @Async
    @Scheduled(cron = "${config.application.payment.pending}", zone = "Asia/Kolkata")
    public void sendNotificationToPaymentPending() {
        if (config.getIsSMSEnabled()) {
            log.info("Starting Cron Job For Sending Notification To Payment Pending");
            processNotifications("PENDING_PAYMENT", ServiceConstants.PAYMENT_PENDING);
        }
    }

    @Async
    @Scheduled(cron = "${cron.case.reassigned.expression}", zone = "Asia/Kolkata")
    public void sendNotificationToCaseReassigned() {
        if (config.getIsSMSEnabled()) {
            log.info("Starting Cron Job For Sending Notification To Case Reassigned");
            processNotifications(CASE_REASSIGNED, ERRORS_PENDING);
        }
    }

    /**
     * Common logic to process notifications based on the case status.
     *
     * @param status            The status of the cases to process.
     * @param notificationType  Notification type for the main case.
     */
    private void processNotifications(String status, String notificationType) {
        RequestInfo requestInfo = requestInfoGenerator.generateSystemRequestInfo();
        List<Future<Boolean>> futures = new ArrayList<>();

        try {
            int offset = 0;
            int limit = 100;
            List<CourtCase> courtCases;

            do {
                courtCases = fetchCases(status, offset, limit, requestInfo);
                log.info("Fetched {} cases for processing with offset {}", courtCases.size(), offset);

                for (CourtCase courtCase : courtCases) {
                    Future<Boolean> future = executorService.submit(() -> processCase(courtCase, requestInfo, notificationType));
                    futures.add(future);
                }

                // Increase the offset for the next batch
                offset += limit;

            } while (courtCases.size() == limit);

            // Wait for all tasks to complete
            handleFutureResults(futures);

            log.info("Completed Cron Job For Sending Notifications");

        } catch (Exception e) {
            log.error("Error occurred during notification processing", e);
        }
    }

    /**
     * Fetches cases based on the given criteria.
     */
    private List<CourtCase> fetchCases(String status, int offset, int limit, RequestInfo requestInfo) {
        Pagination pagination = Pagination.builder().limit( limit).offSet( offset).build();
        CaseCriteria criteria = CaseCriteria.builder()
                .status(Collections.singletonList(status))
                .filingToDate(LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                .filingFromDate(LocalDate.now().minusDays(Integer.parseInt(config.getUserNotificationPeriod()))
                        .atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                .pagination(pagination)
                .build();

        List<CaseCriteria> criteriaList = caseRepository.getCases(Collections.singletonList(criteria), requestInfo);
        return criteriaList.get(0).getResponseList();
    }

    /**
     * Processes a single court case and sends notifications.
     */
    private Boolean processCase(CourtCase courtCase, RequestInfo requestInfo, String notificationType) {
        try {
            if (ServiceConstants.ADVOCATE_ESIGN_PENDING.equalsIgnoreCase(notificationType)
                    && !CollectionUtils.isEmpty(courtCase.getRepresentatives())) {
                for (AdvocateMapping mapping : courtCase.getRepresentatives()) {
                    notificationService.sendNotification(requestInfo, courtCase, notificationType, mapping.getAuditDetails().getCreatedBy());
                }
            } else {
                notificationService.sendNotification(requestInfo, courtCase, notificationType, courtCase.getAuditdetails().getCreatedBy());
            }

            if(ERRORS_PENDING.equalsIgnoreCase(notificationType)){
                ProcessInstance processInstance = workflowService.getCurrentWorkflow(requestInfo, config.getTenantId(), courtCase.getFilingNumber());
                Long createdTime = processInstance.getAuditDetails().getCreatedTime();
                if(shouldTriggerSms(createdTime)){
                    if (courtCase.getRepresentatives() != null) {
                        callNotificationServiceForAdvocates(courtCase, requestInfo, notificationType);
                    }
                    else{
                        notificationService.sendNotification(requestInfo, courtCase, notificationType, courtCase.getAuditdetails().getCreatedBy());
                    }
                    callNotificationServiceForLitigants(courtCase, requestInfo, notificationType);
                }

            }

            return true;
        } catch (Exception e) {
            log.error("Error processing case: {}", courtCase.getId(), e);
            return false;
        }
    }

    public boolean shouldTriggerSms(long createdTime) {

        Instant currentTime = Instant.now();
        Instant createdInstant = Instant.ofEpochMilli(createdTime);
        long threeDaysInMillis = Duration.ofDays(3).toMillis();
        long twentyDaysInMillis = Duration.ofDays(20).toMillis();

        // Get the time difference in milliseconds from createdTime
        long timeSinceCreation = Duration.between(createdInstant, currentTime).toMillis();

        // If more than 20 days have passed since creation, do not trigger
        if (timeSinceCreation > twentyDaysInMillis) {
            return false;
        }

        // Find the closest multiple of 3 days (72 hours)
        long nextTriggerTimeMillis = (timeSinceCreation / threeDaysInMillis) * threeDaysInMillis + threeDaysInMillis;

        // Calculate the ±6 hours window around the next trigger time
        long toleranceMillis = Duration.ofHours(6).toMillis();
        long windowStartMillis = nextTriggerTimeMillis - toleranceMillis;
        long windowEndMillis = nextTriggerTimeMillis + toleranceMillis;

        // Check if the current time is within the tolerance window around the next trigger time
        return currentTime.toEpochMilli() >= windowStartMillis && currentTime.toEpochMilli() <= windowEndMillis;
    }



    public void callNotificationServiceForAdvocates(CourtCase courtCase, RequestInfo requestInfo, String messageCode) {
        for (AdvocateMapping mapping : courtCase.getRepresentatives()) {
            notificationService.sendNotification(requestInfo, courtCase, messageCode, mapping.getAuditDetails().getCreatedBy());
        }
    }

    public void callNotificationServiceForLitigants(CourtCase courtCase, RequestInfo requestInfo, String messageCode) {
        for (Party litigant : courtCase.getLitigants()) {
            notificationService.sendNotification(requestInfo, courtCase, messageCode, litigant.getIndividualId());
        }
    }

    /**
     * Handles future results and logs warnings for failed tasks.
     */
    private void handleFutureResults(List<Future<Boolean>> futures) {
        for (Future<Boolean> future : futures) {
            try {
                if (!future.get()) {
                    log.warn("Failed to send notifications in some cases");
                }
            } catch (InterruptedException | ExecutionException e) {
                log.error("Error waiting for task completion", e);
            }
        }
    }
}
