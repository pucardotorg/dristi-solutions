package digit.service;

import digit.enrichment.HearingsEnrichment;
import digit.util.HearingUtil;
import digit.util.SchedulerUtil;
import digit.web.models.*;
import digit.web.models.scheduler.JudgeRuleResponse;
import digit.web.models.scheduler.JudgeCalenderSearchCriteria;
import digit.web.models.scheduler.JudgeCalenderSearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.HEARING_SEARCH_EXCEPTION;

@Service
@Slf4j
public class HearingService {

    private final HearingUtil hearingUtil;

    private final HearingsEnrichment hearingsEnrichment;

    private final SchedulerUtil schedulerUtil;

    @Autowired
    public HearingService(HearingUtil hearingUtil, HearingsEnrichment hearingsEnrichment, SchedulerUtil schedulerUtil) {
        this.hearingUtil = hearingUtil;
        this.hearingsEnrichment = hearingsEnrichment;
        this.schedulerUtil = schedulerUtil;
    }

    public HearingSearchListResponse searchHearings(HearingSearchRequest hearingSearchRequest) {

        log.info("search hearings, result= IN_PROGRESS,  request = {} ", hearingSearchRequest);

        try {

            HearingListResponse hearingListResponse = hearingUtil.getHearings(hearingSearchRequest);

            List<HearingSearchResponse> hearingSearchResponseList = new ArrayList<>();

            if (hearingListResponse != null && hearingListResponse.getHearingList() != null) {
                hearingSearchResponseList = hearingsEnrichment.enrichHearings(hearingListResponse.getHearingList());
                return HearingSearchListResponse.builder()
                        .totalCount(hearingListResponse.getTotalCount())
                        .hearingList(hearingSearchResponseList)
                        .build();
            }

            log.info("search hearings, result= SUCCESS, response = {} ", hearingListResponse);

            return HearingSearchListResponse.builder()
                    .totalCount(0)
                    .hearingList(hearingSearchResponseList)
                    .build();

        } catch (Exception e) {
            log.error("Error occurred while searching hearings");
            throw new CustomException(HEARING_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    private String getJudgeIdFromHearing(List<Hearing> hearingList) {
        if(!hearingList.isEmpty()){
            return hearingList.get(0).getPresidedBy().getJudgeID().get(0);
        }
        return "";
    }

    private List<String> getOptOutDates(HearingSearchRequest hearingSearchRequest, String judgeId) {
        List<String> optOutDates = new ArrayList<>();
        JudgeCalenderSearchRequest judgeCalenderSearchRequest = JudgeCalenderSearchRequest.builder().build();
        JudgeCalenderSearchCriteria criteria = JudgeCalenderSearchCriteria.builder()
                .judgeId(judgeId)
                .fromDate(hearingSearchRequest.getCriteria().getFromDate())
                .toDate(hearingSearchRequest.getCriteria().getToDate())
                .ruleType(List.of("RESCHEDULE"))
                .courtId(hearingSearchRequest.getCriteria().getCourtId())
                .tenantId(hearingSearchRequest.getCriteria().getTenantId())
                .build();
        judgeCalenderSearchRequest.setRequestInfo(hearingSearchRequest.getRequestInfo());
        judgeCalenderSearchRequest.setCriteria(criteria);

        log.info("Judge Calendar Search Request :: {} ", judgeCalenderSearchRequest);
        JudgeRuleResponse judgeCalendarResponse = schedulerUtil.searchJudgeCalender(judgeCalenderSearchRequest);
        log.info("Judge Calendar Response :: {} ", judgeCalendarResponse);
        if(judgeCalendarResponse!=null && judgeCalendarResponse.getJudgeCalendarRules()!=null){
            judgeCalendarResponse.getJudgeCalendarRules().forEach(judgeCalendarRule -> {
                optOutDates.add(convertLongDateToDateString(judgeCalendarRule.getDate()));
            });
        }

        return optOutDates;

    }

    private String convertLongDateToDateString(Long date) {
        return Instant.ofEpochMilli(date)
                .atZone(ZoneId.of("Asia/Kolkata"))
                .toLocalDate()
                .toString();
    }

}
