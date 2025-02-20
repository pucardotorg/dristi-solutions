package digit.service;

import digit.config.Configuration;
import digit.web.models.CaseDiary;
import digit.web.models.CaseDiaryGenerateRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static digit.config.ServiceConstants.DIARY_TYPE;

@Service
@Slf4j
public class GenerateDiaryService {

    @Autowired
    private Configuration configuration;

    @Autowired
    private DiaryService diaryService;

    private static final String TIME_ZONE = "Asia/Kolkata";

    // This runs everyday at 11:59 PM
    //59 23 * * * *

    @Scheduled(cron = "#{@scheduleCronExpression}", zone = TIME_ZONE)
    public void generateDiary() {
        log.info("Starting cron job for generating diary");

        try {
            CaseDiaryGenerateRequest generateRequest = new CaseDiaryGenerateRequest();
            RequestInfo requestInfo = new RequestInfo();
            CaseDiary diary = new CaseDiary();
            diary.setDiaryDate(generateDiaryDate());
            diary.setDiaryType(DIARY_TYPE);
            diary.setJudgeId(configuration.getJudgeId());
            diary.setTenantId(configuration.getTenantId());

            generateRequest.setDiary(diary);
            generateRequest.setRequestInfo(requestInfo);
            diaryService.generateDiary(generateRequest);
        } catch (Exception ex) {
            log.error("Error generating diary :: {}", ex.getMessage());
        }

        log.info("Cron job completed for generating diary");
    }

    private Long generateDiaryDate() {
        // Get current date
        LocalDate today = LocalDate.now();

        // Get 12:00 AM time for today
        ZonedDateTime midnight = today.atStartOfDay(ZoneId.of(TIME_ZONE));

        // Convert to epoch milliseconds
        long epochMillis = midnight.toInstant().toEpochMilli();

        log.info("Epoch Time (Milliseconds) :: {} for date :: {} " , epochMillis,today);
        return epochMillis;
    }
}