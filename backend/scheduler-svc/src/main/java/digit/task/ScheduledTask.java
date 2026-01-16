package digit.task;

import digit.config.Configuration;
import digit.service.CauseListService;
import digit.service.HearingService;
import digit.service.LandingPageService;
import digit.service.PendingTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@EnableScheduling
public class ScheduledTask {

    private final CauseListService causeListService;

    private final HearingService hearingService;

    private final LandingPageService landingPageService;

    private final PendingTaskService pendingTaskService;

    private final Configuration config;

    @Autowired
    public ScheduledTask(CauseListService causeListService, HearingService hearingService, LandingPageService landingPageService, PendingTaskService pendingTaskService, Configuration config) {
        this.causeListService = causeListService;
        this.hearingService = hearingService;
        this.landingPageService = landingPageService;
        this.pendingTaskService = pendingTaskService;
        this.config = config;
    }

    @Async
    @Scheduled(cron = "${config.causelist.generate}", zone = "Asia/Kolkata")
    public void generateCauseList() {
        log.info("Starting Cron Job For Generating CauseList");
        causeListService.updateCauseListForTomorrow();
        log.info("Completed Cron Job For Generating CauseList");
    }

    @Async
    @Scheduled(cron = "${config.hearing.abort}", zone = "Asia/Kolkata")
    public void abortCauseList() {
        log.info("Starting Cron Job For Abating Hearing");
        hearingService.abatHearings();
        log.info("Completed Cron Job For Abating Hearing");
    }

    @Async
    @Scheduled(cron = "${config.landing.page.dashboard.update}", zone = "Asia/Kolkata")
    public void updateDashboardMetrics() {
        if (!config.isEnableDashboardMetricsUpdate()) {
            log.info("Dashboard metrics update is disabled");
            return;
        }
        log.info("Starting Cron Job for updating dashboard metrics");
        landingPageService.updateDashboardMetrics();
        log.info("Completed Cron Job For updating dashboard metrics");
    }

    @Async
    @Scheduled(cron = "${config.expire.pending.tasks}", zone = "Asia/Kolkata")
    public void expirePendingTasks() {
        log.info("Starting Cron Job for expiring pending tasks");
        pendingTaskService.expirePendingTasks();
        log.info("Completed Cron Job For expiring pending tasks");
    }

}
