package digit.repository.querybuilder;


import digit.helper.QueryBuilderHelper;
import digit.web.models.ReScheduleHearingReqSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class ReScheduleHearingQueryBuilder {

    private static final String BASE_APPLICATION_QUERY = "SELECT hbr.reschedule_request_id, hbr.hearing_booking_id, hbr.tenant_id, hbr.judge_id, hbr.case_id,hbr.requester_id,hbr.reason,hbr.status, hbr.created_by,hbr.last_modified_by,hbr.created_time,hbr.last_modified_time, hbr.row_version, hbr.suggested_days , hbr.available_days, hbr.litigants, hbr.representatives  ";
    private static final String FROM_TABLES = " FROM hearing_booking_reschedule_request hbr ";
    private static final String ORDER_BY = " ORDER BY hbr.last_modified_time DESC";
    private static final String LIMIT_OFFSET = " LIMIT ? OFFSET ?";


    private final QueryBuilderHelper helper;

    @Autowired
    public ReScheduleHearingQueryBuilder(QueryBuilderHelper helper) {
        this.helper = helper;
    }

    public String getReScheduleRequestQuery(ReScheduleHearingReqSearchCriteria searchCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, Integer limit, Integer offset) {
        StringBuilder query = new StringBuilder(BASE_APPLICATION_QUERY);
        query.append(FROM_TABLES);

        if (!CollectionUtils.isEmpty(searchCriteria.getRescheduledRequestId())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.reschedule_request_id IN ( ").append(helper.createQuery(searchCriteria.getRescheduledRequestId())).append(" ) ");
            helper.addToPreparedStatement(preparedStmtList, preparedStmtArgList, searchCriteria.getRescheduledRequestId());
        }

        if (!ObjectUtils.isEmpty(searchCriteria.getTenantId())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.tenant_id = ? ");
            preparedStmtList.add(searchCriteria.getTenantId());
            preparedStmtArgList.add(Types.VARCHAR);

        }

        if (!ObjectUtils.isEmpty(searchCriteria.getJudgeId())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.judge_id = ? ");
            preparedStmtList.add(searchCriteria.getJudgeId());
            preparedStmtArgList.add(Types.VARCHAR);

        }

        //bug
        if (!ObjectUtils.isEmpty(searchCriteria.getCaseId())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.case_id = ? ");
            preparedStmtList.add(searchCriteria.getJudgeId());
            preparedStmtArgList.add(Types.VARCHAR);

        }

        if (!ObjectUtils.isEmpty(searchCriteria.getHearingBookingId())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.hearing_booking_id = ? ");
            preparedStmtList.add(searchCriteria.getHearingBookingId());
            preparedStmtArgList.add(Types.VARCHAR);

        }
        if (!ObjectUtils.isEmpty(searchCriteria.getRequesterId())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.requester_id = ? ");
            preparedStmtList.add(searchCriteria.getRequesterId());
            preparedStmtArgList.add(Types.VARCHAR);

        }
        if (!ObjectUtils.isEmpty(searchCriteria.getStatus())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.status = ? ");
            preparedStmtList.add(searchCriteria.getStatus());
            preparedStmtArgList.add(Types.VARCHAR);

        }
        if (!ObjectUtils.isEmpty(searchCriteria.getDueDate())) {
            helper.addClauseIfRequired(query, preparedStmtList);
            query.append(" hbr.last_modified_time < ?  ");
            preparedStmtList.add(searchCriteria.getDueDate());
            preparedStmtArgList.add(Types.BIGINT);

        }
        query.append(ORDER_BY);
        if (!ObjectUtils.isEmpty(limit) && !ObjectUtils.isEmpty(offset)) {
            query.append(LIMIT_OFFSET);
            preparedStmtList.add(limit);
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtList.add(offset);
            preparedStmtArgList.add(Types.VARCHAR);

        }


        return query.toString();
    }
}
