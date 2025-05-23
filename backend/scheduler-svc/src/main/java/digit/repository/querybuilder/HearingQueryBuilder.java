package digit.repository.querybuilder;

import digit.helper.QueryBuilderHelper;
import digit.web.models.ScheduleHearingSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.sql.Types;
import java.util.List;


@Component
@Slf4j
public class HearingQueryBuilder {

    private static final String FROM_TABLES = " FROM hearing_booking hb ";
    private static final String BASE_APPLICATION_QUERY = "SELECT  hb.hearing_booking_id, hb.tenant_id, hb.court_id,hb.hearing_date, hb.judge_id, hb.case_id, hb.hearing_type, hb.title, hb.description, hb.status, hb.start_time, hb.end_time, hb.created_by,hb.last_modified_by,hb.created_time,hb.last_modified_time, hb.row_version ,hb.reschedule_request_id ,hb.case_stage";
    private static final String LIMIT_OFFSET = " LIMIT ? OFFSET ?";

    private final QueryBuilderHelper queryBuilderHelper;

    @Autowired
    public HearingQueryBuilder(QueryBuilderHelper queryBuilderHelper) {
        this.queryBuilderHelper = queryBuilderHelper;
    }

    public String getHearingQuery(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, Integer limit, Integer offset) {

        StringBuilder query = new StringBuilder(BASE_APPLICATION_QUERY);
        query.append(FROM_TABLES);

        getWhereFields(scheduleHearingSearchCriteria, query, preparedStmtList, preparedStmtArgList);
        queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
        // Adding expiry_time condition
        query.append(" (hb.expiry_time IS NULL OR hb.expiry_time > EXTRACT(EPOCH FROM NOW())) ");
        addLimitOffset(query, preparedStmtList, preparedStmtArgList, limit, offset);
        return query.toString();
    }

    public String getHearingDayAndOccupiedBandwidthForDayQuery(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder query = new StringBuilder(
                "SELECT hb.hearing_date, SUM(((hb.end_time - hb.start_time) * 60) / 3600000) AS total_mins " +
                        "FROM hearing_booking hb "
        );

        getWhereFields(scheduleHearingSearchCriteria, query, preparedStmtList, preparedStmtArgList);
        queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
        // Adding expiry_time condition
        query.append(" (hb.expiry_time IS NULL OR hb.expiry_time > EXTRACT(EPOCH FROM NOW())) ");
        query.append("GROUP BY hb.hearing_date");
        addLimitOffset(query, preparedStmtList, preparedStmtArgList, null, null);
        return query.toString();
    }


    private void getWhereFields(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {


        if (!CollectionUtils.isEmpty(scheduleHearingSearchCriteria.getHearingIds())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.hearing_booking_id IN ( ").append(queryBuilderHelper.createQuery(scheduleHearingSearchCriteria.getHearingIds())).append(" ) ");
            queryBuilderHelper.addToPreparedStatement(preparedStmtList, preparedStmtArgList, scheduleHearingSearchCriteria.getHearingIds());
        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getTenantId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.tenant_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getTenantId());
            preparedStmtArgList.add(Types.VARCHAR);

        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getJudgeId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.judge_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getJudgeId());
            preparedStmtArgList.add(Types.VARCHAR);


        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getCourtId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.court_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getCourtId());
            preparedStmtArgList.add(Types.VARCHAR);

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getCaseId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.case_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getCaseId());
            preparedStmtArgList.add(Types.VARCHAR);

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getHearingType())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.hearing_type = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getHearingType());
            preparedStmtArgList.add(Types.VARCHAR);

        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getStartDateTime())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.start_time >= ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getStartDateTime());
            preparedStmtArgList.add(Types.BIGINT);

        }
        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getEndDateTime())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hb.end_time <= ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getEndDateTime());
            preparedStmtArgList.add(Types.BIGINT);

        }

        if (!ObjectUtils.isEmpty(scheduleHearingSearchCriteria.getRescheduleId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append("hb.reschedule_request_id = ? ");
            preparedStmtList.add(scheduleHearingSearchCriteria.getRescheduleId());
            preparedStmtArgList.add(Types.VARCHAR);
        }

        if (!CollectionUtils.isEmpty(scheduleHearingSearchCriteria.getStatus())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" ( ");
            for (int i = 0; i < scheduleHearingSearchCriteria.getStatus().size() - 1; i++) {
                query.append(" hb.status = ? ").append(" or ");
                preparedStmtList.add(scheduleHearingSearchCriteria.getStatus().get(i + 1));
                preparedStmtArgList.add(Types.VARCHAR);

            }
            query.append("hb.status = ? )");
            preparedStmtList.add(scheduleHearingSearchCriteria.getStatus().get(0));
            preparedStmtArgList.add(Types.VARCHAR);


        }

    }

    private static void addLimitOffset(StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, Integer limit, Integer offset) {
        if (!ObjectUtils.isEmpty(limit) && !ObjectUtils.isEmpty(offset)) {
            query.append(LIMIT_OFFSET);
            preparedStmtList.add(limit);
            preparedStmtArgList.add(Types.INTEGER);

            preparedStmtList.add(offset);
            preparedStmtArgList.add(Types.INTEGER);

        }
    }


}
