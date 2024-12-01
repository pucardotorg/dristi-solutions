package digit.repository.querybuilder;

import digit.helper.QueryBuilderHelper;
import digit.util.DateUtil;
import digit.web.models.ScheduleHearingSearchCriteria;
import digit.web.models.hearing.HearingSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.sql.Types;
import java.util.List;

import static digit.config.ServiceConstants.BLOCKED;
import static digit.config.ServiceConstants.SCHEDULE;


@Component
@Slf4j
public class HearingQueryBuilder {

    private static final String FROM_TABLES = " FROM hearing_booking hb ";
    private final String BASE_APPLICATION_QUERY = "SELECT  hb.hearing_booking_id, hb.tenant_id, hb.court_id,hb.hearing_date, hb.judge_id, hb.case_id, hb.hearing_type, hb.title, hb.description, hb.status, hb.start_time, hb.end_time, hb.created_by,hb.last_modified_by,hb.created_time,hb.last_modified_time, hb.row_version ,hb.reschedule_request_id";
    private final String ORDER_BY = " ORDER BY ";
    private final String GROUP_BY = " GROUP BY ";
    private final String LIMIT_OFFSET = " LIMIT ? OFFSET ?";

    private final String BASE_HEARING_QUERY = "SELECT dh.hearingtype, dh.starttime, dc.casenumber, dc.courtid, dc.id as caseid, dc.casetitle, da.applicationnumber FROM dristi_hearing dh ";
    private final String JOIN_CASE_QUERY = " JOIN dristi_cases dc ON EXISTS (SELECT 1 FROM jsonb_array_elements_text(dh.filingnumber) AS elem WHERE elem = dc.filingnumber) ";
    private final String JOIN_REPRESENTATIVE_QUERY = " JOIN dristi_case_representatives dcr ON dcr.case_id = dc.id ";
    private final String JOIN_APPLICATION_QUERY = " JOIN dristi_application da ON EXISTS (SELECT 1 FROM jsonb_array_elements_text(dh.applicationnumbers) AS elem WHERE elem = da.applicationnumber) ";
    private final String PENDINGAPPROVAL = "PENDINGAPPROVAL";

    @Autowired
    private QueryBuilderHelper queryBuilderHelper;

    @Autowired
    private DateUtil dateUtil;

    public String getHearingQuery(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, List<Object> preparedStmtList, Integer limit, Integer offset) {

        StringBuilder query = new StringBuilder(BASE_APPLICATION_QUERY);
        query.append(FROM_TABLES);

        getWhereFields(scheduleHearingSearchCriteria, query, preparedStmtList, limit, offset);

        return query.toString();
    }

    public String getJudgeAvailableDatesQuery(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder("SELECT meeting_hours.hearing_date AS date,meeting_hours.total_hours  AS hours ");
        query.append("FROM (");
        query.append("SELECT hb.hearing_date, SUM(((hb.end_time - hb.start_time)*60) / 3600000) AS total_hours ");
        query.append("FROM hearing_booking hb ");

        getWhereFields(scheduleHearingSearchCriteria, query, preparedStmtList, null, null);
        queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
        query.append(" ( hb.status = ? ");
        preparedStmtList.add(BLOCKED);
        query.append(" OR hb.status = ? )");
        preparedStmtList.add(SCHEDULE);


        query.append("GROUP BY hb.hearing_date) AS meeting_hours ");

        return query.toString();
    }


    private void getWhereFields(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, StringBuilder query, List<Object> preparedStmtList, Integer limit, Integer offset) {


        if (!CollectionUtils.isEmpty(scheduleHearingSearchCriteria.getHearingIds())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.hearing_booking_id IN ( ").append(queryBuilderHelper.createQuery(scheduleHearingSearchCriteria.getHearingIds())).append(" ) ");
            queryBuilderHelper.addToPreparedStatement(preparedStmtList, scheduleHearingSearchCriteria.getHearingIds());
        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getTenantId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.tenant_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getTenantId());

        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getJudgeId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.judge_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getJudgeId());

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getCourtId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.court_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getCourtId());

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getCaseId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.case_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getCaseId());

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getHearingType())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.hearing_type = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getHearingType());

        }
//        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getFromDate())) {
//            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
//            query.append(" TO_DATE(hb.hearing_date, 'YYYY-MM-DD')  >= ? ");
//            preparedStmtList.add(scheduleHearingSearchCriteria.getFromDate());
//
//        }
//        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getToDate())) {
//            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
//            query.append(" TO_DATE(hb.hearing_date, 'YYYY-MM-DD') <= ? ");
//            preparedStmtList.add(scheduleHearingSearchCriteria.getToDate());
//
//        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getStartDateTime())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.start_time >= ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getStartDateTime());

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getEndDateTime())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.end_time <= ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getEndDateTime());

        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getRescheduleId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append("hb.reschedule_request_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getRescheduleId());
        }

        if (!CollectionUtils.isEmpty(scheduleHearingSearchCriteria.getStatus())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" ( ");
            for (int i = 0; i < scheduleHearingSearchCriteria.getStatus().size() - 1; i++) {
                query.append(" hb.status = ? ").append(" or ");
                preparedStmtList.add(scheduleHearingSearchCriteria.getStatus().get(i+1).toString());
            }
            query.append("hb.status = ? )");
            preparedStmtList.add(scheduleHearingSearchCriteria.getStatus().get(0).toString());

        }

        if (!ObjectUtils.isEmpty(limit) && !ObjectUtils.isEmpty(offset)) {
            query.append(LIMIT_OFFSET);
            preparedStmtList.add(limit);
            preparedStmtList.add(offset);
        }
    }

    public String getHearingsQuery(HearingSearchCriteria hearingSearchCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgsList) {
        StringBuilder query = new StringBuilder(BASE_HEARING_QUERY);
        query.append(JOIN_CASE_QUERY);
//        query.append(JOIN_REPRESENTATIVE_QUERY);
        query.append(JOIN_APPLICATION_QUERY);
        if(!ObjectUtils.isEmpty(hearingSearchCriteria.getFromDate())){
            Long fromDate = dateUtil.getEPochFromLocalDate(hearingSearchCriteria.getFromDate());
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" starttime >= ? ");
            preparedStmtList.add(fromDate);
            preparedStmtArgsList.add(Types.BIGINT);
        }

        if(!ObjectUtils.isEmpty(hearingSearchCriteria.getToDate())) {
            Long toDate = dateUtil.getEPochFromLocalDate(hearingSearchCriteria.getToDate());
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" starttime <= ? ");
            preparedStmtList.add(toDate);
            preparedStmtArgsList.add(Types.BIGINT);
        }

        queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
        query.append(" da.status = ? ");
        preparedStmtList.add(PENDINGAPPROVAL);
        preparedStmtArgsList.add(Types.VARCHAR);
        
        return query.toString();
    }
}
