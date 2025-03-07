package digit.service.hearing;


import digit.config.Configuration;
import digit.kafka.producer.Producer;
import digit.mapper.CustomMapper;
import digit.service.HearingService;
import digit.util.DateUtil;
import digit.util.HearingUtil;
import digit.web.models.Pair;
import digit.web.models.ScheduleHearing;
import digit.web.models.ScheduleHearingRequest;
import digit.web.models.hearing.Hearing;
import digit.web.models.hearing.HearingRequest;
import digit.web.models.hearing.HearingUpdateBulkRequest;
import digit.web.models.hearing.PresidedBy;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class HearingProcessor {

    private final CustomMapper customMapper;
    private final HearingService hearingService;
    private final DateUtil dateUtil;
    private final HearingUtil hearingUtil;
    private final Producer producer;
    private final Configuration config;


    @Autowired
    public HearingProcessor(CustomMapper customMapper, HearingService hearingService, Producer producer, DateUtil dateUtil, HearingUtil hearingUtil, Configuration config) {
        this.customMapper = customMapper;
        this.hearingService = hearingService;
        this.dateUtil = dateUtil;
        this.hearingUtil = hearingUtil;
        this.producer = producer;
        this.config = config;
    }


    /**
     * This method is used to process a request to schedule a hearing.
     * It calculates the start time and end time of the hearing and schedules it in the hearing booking table.
     * It also updates the hearing in the hearing module with the scheduled time.
     *
     * @param hearingRequest a {@link HearingRequest} object containing the hearing details.
     */
    public void processCreateHearingRequest(HearingRequest hearingRequest) {
        log.info("operation = processCreateHearingRequest, result = IN_PROGRESS, hearingId={}", hearingRequest.getHearing().getHearingId());
        try {
            Hearing hearing = hearingRequest.getHearing();
            RequestInfo requestInfo = hearingRequest.getRequestInfo();
            PresidedBy presidedBy = hearing.getPresidedBy();
            List<String> filling = hearing.getFilingNumber();

            log.debug("calculating start time and end time for hearing");
            Pair<Long, Long> startTimeAndEndTime = getStartTimeAndEndTime(hearing.getStartTime());

            ScheduleHearing scheduleHearing = customMapper.hearingToScheduleHearingConversion(hearing);
            scheduleHearing.setCaseId(filling.get(0));
            scheduleHearing.setStartTime(startTimeAndEndTime.getKey());
            scheduleHearing.setEndTime(startTimeAndEndTime.getValue());
            scheduleHearing.setHearingDate(startTimeAndEndTime.getKey());

            // currently one judge only if there are other judge then we need to block all judge calendar and remove default judge id
            String judgeId = (presidedBy.getJudgeID().isEmpty()) ? "JUDGE_ID" : presidedBy.getJudgeID().get(0);

            scheduleHearing.setJudgeId(judgeId);
            scheduleHearing.setCourtId(presidedBy.getCourtID());
            scheduleHearing.setStatus("SCHEDULED");

            ScheduleHearingRequest request = ScheduleHearingRequest.builder().hearing(Collections.singletonList(scheduleHearing)).requestInfo(requestInfo).build();
            log.debug("assigning start time and end time for hearing, hearingId={}", hearing.getHearingId());
            List<ScheduleHearing> scheduledHearings = hearingService.schedule(request);   // BLOCKED THE JUDGE CALENDAR
            ScheduleHearing scheduledHearing = scheduledHearings.get(0);

            hearing.setStartTime(scheduledHearing.getStartTime());
            hearing.setEndTime(scheduledHearing.getEndTime());

            hearingRequest.setHearing(hearing);

            HearingUpdateBulkRequest updateHearingRequest = HearingUpdateBulkRequest.builder()
                    .requestInfo(requestInfo)
                    .hearings(Collections.singletonList(hearing))
                    .build();
            log.debug("updating hearing in hearing module,hearingId={}", hearing.getHearingId());
            hearingUtil.callHearing(updateHearingRequest);

            producer.push(config.getScheduleHearingTopic(), ScheduleHearingRequest.builder().requestInfo(requestInfo).hearing(scheduledHearings).build());
            log.info("operation = processCreateHearingRequest, result = SUCCESS, hearingId={}", hearing.getHearingId());

        } catch (Exception e) {
            log.error("operation = processCreateHearingRequest, result = FAILURE, error = {}", e.getMessage(), e);
            log.error("error occurred while assigning start time and end time for hearing, hearingId={}", hearingRequest.getHearing().getHearingId());
        }

    }

    /**
     * Returns a pair of start and end times for a given epoch time.
     *
     * @param epochTime the given epoch time
     * @return a pair of start and end times in epoch milliseconds
     */
    private Pair<Long, Long> getStartTimeAndEndTime(Long epochTime) {
        log.info("operation = getStartTimeAndEndTime, result = IN_PROGRESS, epochTime={}", epochTime);

        LocalDate startOfDay = dateUtil.getLocalDateFromEpoch(epochTime);
        LocalDate nextDay = startOfDay.plusDays(1);
        long startEpochMillis = dateUtil.getEPochFromLocalDate(startOfDay);
        long endEpochMillis = dateUtil.getEPochFromLocalDate(nextDay);
        log.info("operation = getStartTimeAndEndTime, result = SUCCESS, startEpochMillis={}, endEpochMillis={}", startEpochMillis, endEpochMillis);

        return new Pair<>(startEpochMillis, endEpochMillis);
    }

}
