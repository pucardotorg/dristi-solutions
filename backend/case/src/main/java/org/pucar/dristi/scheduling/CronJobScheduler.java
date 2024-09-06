package org.pucar.dristi.scheduling;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.service.NotificationService;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

@Component
@Slf4j
@EnableScheduling
public class CronJobScheduler {

    private final CaseRepository caseRepository;

    private final RequestInfoGenerator requestInfoGenerator;

    private final NotificationService notificationService;

    private final Configuration config;

    @Autowired
    public CronJobScheduler(CaseRepository caseRepository, RequestInfoGenerator requestInfoGenerator, NotificationService notificationService, Configuration config) {
        this.caseRepository = caseRepository;
        this.requestInfoGenerator = requestInfoGenerator;
        this.notificationService = notificationService;
        this.config = config;
    }

    @Async
    @Scheduled(cron = "${config.case.esign.pending}", zone = "Asia/Kolkata")
    public void sendNotificationToESignPending() {
        if(config.getIsSMSEnabled()) {
            log.info("Starting Cron Job For Sending Notification To ESign Pending");
            RequestInfo requestInfo = requestInfoGenerator.generateSystemRequestInfo();
            ExecutorService executorService = Executors.newCachedThreadPool();
            List<Future<Boolean>> futures = new ArrayList<>();

            try {
                int offset = 0;
                int limit = 100;
                List<CourtCase> courtCases;

                do {
                    Pagination pagination = Pagination.builder().limit((double) limit).offSet((double) offset).build();
                    CaseCriteria criteria = CaseCriteria.builder()
                            .status(Collections.singletonList("DRAFT_IN_PROGRESS"))
                            .filingToDate(LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                            .filingFromDate(LocalDate.now().minusDays(Integer.parseInt(config.getUserNotificationPeriod())).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                            .pagination(pagination)
                            .build();

                    List<CaseCriteria> criteriaList = caseRepository.getCases(Collections.singletonList(criteria), requestInfo);
                    courtCases = criteriaList.get(0).getResponseList();
                    log.info("Fetched {} cases for processing with offset {}", courtCases.size(), offset);

                    for (CourtCase courtCase : courtCases) {
                        Future<Boolean> future = executorService.submit(() -> {
                            try {
                                    notificationService.sendNotification(requestInfo, courtCase, ServiceConstants.ESIGN_PENDING, courtCase.getAuditdetails().getCreatedBy());
                                if (!CollectionUtils.isEmpty(courtCase.getRepresentatives())) {
                                    for (AdvocateMapping mapping : courtCase.getRepresentatives()) {
                                        notificationService.sendNotification(requestInfo, courtCase, ServiceConstants.ADVOCATE_ESIGN_PENDING, mapping.getAuditDetails().getCreatedBy());

                                    }
                                }
                                return true;
                            } catch (Exception e) {
                                log.error("Error processing case: {}", courtCase.getId(), e);
                                return false;
                            }
                        });
                        futures.add(future);
                    }
                    // Increase the offset for the next batch
                    offset += limit;

                } while (courtCases.size() == limit);

                for (Future<Boolean> future : futures) {
                    try {
                        if (!future.get()) {
                            log.warn("Failed to Send notifications in some cases");
                        }
                    } catch (InterruptedException | ExecutionException e) {
                        log.error("Error waiting for task completion", e);
                    }
                }

                log.info("Completed Cron Job For Sending Notification To ESign Pending");
            } catch (Exception e) {
                log.error("Error occurred during Cron Job For Sending Notification To ESign Pending", e);
            } finally {
                executorService.shutdown();
            }
        }
    }

    @Async
    @Scheduled(cron = "${config.application.payment.pending}", zone = "Asia/Kolkata")
    public void sendNotificationToPaymentPending() {
        if(config.getIsSMSEnabled()) {
            log.info("Starting Cron Job For Sending Notification To Payment Pending");
            RequestInfo requestInfo = requestInfoGenerator.generateSystemRequestInfo();
            ExecutorService executorService = Executors.newCachedThreadPool();
            List<Future<Boolean>> futures = new ArrayList<>();

            try {
                int offset = 0;
                int limit = 100;
                List<CourtCase> courtCases;

                do {
                    Pagination pagination = Pagination.builder().limit((double) limit).offSet((double) offset).build();
                    CaseCriteria criteria = CaseCriteria.builder()
                            .status(Collections.singletonList("PAYMENT_PENDING"))
                            .filingToDate(LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                            .filingFromDate(LocalDate.now().minusDays(Integer.parseInt(config.getUserNotificationPeriod())).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                            .pagination(pagination)
                            .build();

                    List<CaseCriteria> criteriaList = caseRepository.getCases(Collections.singletonList(criteria), requestInfo);
                    courtCases = criteriaList.get(0).getResponseList();
                    log.info("Fetched {} cases for processing with offset {}", courtCases.size(), offset);

                    for (CourtCase courtCase : courtCases) {
                        Future<Boolean> future = executorService.submit(() -> {
                            try {

                                notificationService.sendNotification(requestInfo, courtCase, ServiceConstants.PAYMENT_PENDING, courtCase.getAuditdetails().getCreatedBy());

                                return true;
                            } catch (Exception e) {
                                log.error("Error processing case: {}", courtCase.getId(), e);
                                return false;
                            }
                        });
                        futures.add(future);
                    }
                    // Increase the offset for the next batch
                    offset += limit;

                } while (courtCases.size() == limit);

                for (Future<Boolean> future : futures) {
                    try {
                        if (!future.get()) {
                            log.warn("Failed to Send notifications in some cases");
                        }
                    } catch (InterruptedException | ExecutionException e) {
                        log.error("Error waiting for task completion", e);
                    }
                }

                log.info("Completed Cron Job For Sending Notification To Payment Pending");
            } catch (Exception e) {
                log.error("Error occurred during Cron Job For Sending Notification To Payment Pending", e);
            } finally {
                executorService.shutdown();
            }
    }
    }
}