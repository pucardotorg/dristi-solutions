package digit.service.hearing;


import com.fasterxml.jackson.databind.JsonNode;
import digit.config.Configuration;
import digit.kafka.producer.Producer;
import digit.mapper.CustomMapper;
import digit.service.HearingService;
import digit.util.CaseUtil;
import digit.util.DateUtil;
import digit.util.HearingUtil;
import digit.web.models.Pair;
import digit.web.models.ScheduleHearing;
import digit.web.models.ScheduleHearingRequest;
import digit.web.models.cases.CaseCriteria;
import digit.web.models.cases.SearchCaseRequest;
import digit.web.models.hearing.Hearing;
import digit.web.models.hearing.HearingRequest;
import digit.web.models.hearing.HearingUpdateBulkRequest;
import digit.web.models.hearing.PresidedBy;
import jakarta.validation.Valid;
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
    private final CaseUtil caseUtil;


    @Autowired
    public HearingProcessor(CustomMapper customMapper, HearingService hearingService, Producer producer, DateUtil dateUtil, HearingUtil hearingUtil, Configuration config, CaseUtil caseUtil) {
        this.customMapper = customMapper;
        this.hearingService = hearingService;
        this.dateUtil = dateUtil;
        this.hearingUtil = hearingUtil;
        this.producer = producer;
        this.config = config;
        this.caseUtil = caseUtil;
    }


    /**
     * This method is used to process a request to schedule a hearing.
     * It calculates the start time and end time of the hearing and schedules it in the hearing booking table.
     * It also updates the hearing in the hearing module with the scheduled time.
     *
     * @param hearingRequest a {@link HearingRequest} object containing the hearing details.
     */
    public void processCreateHearingRequest(HearingRequest hearingRequest, Boolean isRetryRequired) {
        log.info("operation = processCreateHearingRequest, result = IN_PROGRESS, hearingId={}", hearingRequest.getHearing().getHearingId());
        try {
            Hearing hearing = hearingRequest.getHearing();
            RequestInfo requestInfo = hearingRequest.getRequestInfo();
            PresidedBy presidedBy = hearing.getPresidedBy();
            List<String> fillingNumbers = hearing.getFilingNumber();

            log.debug("calculating start time and end time for hearing");
            Pair<Long, Long> startTimeAndEndTime = getStartTimeAndEndTime(hearing.getStartTime());

            ScheduleHearing scheduleHearing = customMapper.hearingToScheduleHearingConversion(hearing);
            enrichCaseDetails(hearingRequest.getRequestInfo(), scheduleHearing, fillingNumbers);
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
            log.info("updating hearing in hearing module,hearingId={}, hearing={}", hearing.getHearingId(), hearing);
            hearingUtil.callHearing(updateHearingRequest, isRetryRequired);

            producer.push(config.getScheduleHearingTopic(), ScheduleHearingRequest.builder().requestInfo(requestInfo).hearing(scheduledHearings).build());
            log.info("operation = processCreateHearingRequest, result = SUCCESS, hearingId={}", hearing.getHearingId());

        } catch (Exception e) {
            log.error("operation = processCreateHearingRequest, result = FAILURE, error = {}", e.getMessage(), e);
            log.error("error occurred while assigning start time and end time for hearing, hearingId={}", hearingRequest.getHearing().getHearingId());
        }

    }

    private void enrichCaseDetails(@Valid RequestInfo requestInfo, ScheduleHearing scheduleHearing, List<String> fillingNumbers) {
        log.info("operation = enrichCaseDetails, result = IN_PROGRESS, fillingNumber={}", fillingNumbers.get(0));
        SearchCaseRequest caseRequest = SearchCaseRequest.builder().RequestInfo(requestInfo).flow("FLOW_JAC")
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(fillingNumbers.get(0)).build())).build();

        JsonNode cases = caseUtil.getCases(caseRequest);
        if (cases != null && cases.isArray() && !cases.isEmpty()) {
            scheduleHearing.setTitle(cases.get(0).get("caseTitle").isNull() ? null : cases.get(0).get("caseTitle").asText());
            scheduleHearing.setCaseId(getCaseId(cases));
            scheduleHearing.setCaseStage(cases.get(0).get("stage").isNull() ? null : cases.get(0).get("stage").asText());
        }
        log.info("operation = enrichCaseDetails, result = SUCCESS");
    }

    private String getCaseId(JsonNode cases) {
        JsonNode caseDetails = cases.get(0);
        String stNumber = caseDetails.get("courtCaseNumber").isNull() ? null : caseDetails.get("courtCaseNumber").asText();
        String cmpNumber = caseDetails.get("cmpNumber").isNull() ? null : caseDetails.get("cmpNumber").asText();
        String filingNumber = caseDetails.get("filingNumber").isNull() ? null : caseDetails.get("filingNumber").asText();
        return (stNumber != null) ? stNumber : (cmpNumber != null) ? cmpNumber : filingNumber;
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
