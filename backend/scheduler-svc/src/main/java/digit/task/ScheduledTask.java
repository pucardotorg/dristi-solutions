package digit.task;

import digit.service.CauseListService;
import digit.service.HearingService;
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

    @Autowired
    public ScheduledTask(CauseListService causeListService, HearingService hearingService) {
        this.causeListService = causeListService;
        this.hearingService = hearingService;
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

}
