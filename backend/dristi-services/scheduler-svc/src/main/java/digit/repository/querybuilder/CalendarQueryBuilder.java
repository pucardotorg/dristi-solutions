package digit.repository.querybuilder;

import digit.helper.QueryBuilderHelper;
import digit.web.models.JudgeCalenderSearchCriteria;
import digit.web.models.JudgeCalenderSearchRequest;
import digit.web.models.SearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class CalendarQueryBuilder {

    private static final String BASE_APPLICATION_QUERY = "SELECT jc.judge_id, jc.id, jc.rule_type, jc.date, jc.notes, jc.created_by,jc.last_modified_by,jc.created_time,jc.last_modified_time, jc.row_version ,jc.tenant_id ,jc.court_ids ";
    private static final String FROM_TABLES = " FROM judge_calendar_rules jc ";

    private final QueryBuilderHelper queryBuilderHelper;

    @Autowired
    public CalendarQueryBuilder(QueryBuilderHelper queryBuilderHelper) {
        this.queryBuilderHelper = queryBuilderHelper;
    }


    public String getJudgeCalendarQuery(SearchCriteria searchCriteria, List<Object> preparedStmtList) {

        StringBuilder query = new StringBuilder(BASE_APPLICATION_QUERY);
        query.append(FROM_TABLES);

        if (!ObjectUtils.isEmpty(searchCriteria.getTenantId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.tenant_id = ? ");
            preparedStmtList.add(searchCriteria.getTenantId());
        }

        if (!ObjectUtils.isEmpty(searchCriteria.getJudgeId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.judge_id = ? ");
            preparedStmtList.add(searchCriteria.getJudgeId());
        }

        if (!ObjectUtils.isEmpty(searchCriteria.getFromDate())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.date >= ? ");
            preparedStmtList.add(searchCriteria.getFromDate());
        }

        if (!ObjectUtils.isEmpty(searchCriteria.getToDate())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.date <= ?");
            preparedStmtList.add(searchCriteria.getToDate());
        }

        return query.toString();
    }

    public String findJudgeCalendarQuery(JudgeCalenderSearchRequest request, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {

        JudgeCalenderSearchCriteria criteria = request.getCriteria();
        StringBuilder query = new StringBuilder(BASE_APPLICATION_QUERY);
        query.append(FROM_TABLES);

        if (!ObjectUtils.isEmpty(criteria.getTenantId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.tenant_id = ? ");
            preparedStmtList.add(criteria.getTenantId());
            preparedStmtArgList.add(Types.VARCHAR);
        }

        if (!ObjectUtils.isEmpty(criteria.getJudgeId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.judge_id = ? ");
            preparedStmtList.add(criteria.getJudgeId());
            preparedStmtArgList.add(Types.VARCHAR);
        }

        if (!ObjectUtils.isEmpty(criteria.getFromDate())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.date >= ? ");
            preparedStmtList.add(criteria.getFromDate());
            preparedStmtArgList.add(Types.INTEGER);
        }

        if (!ObjectUtils.isEmpty(criteria.getToDate())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.date <= ?");
            preparedStmtList.add(criteria.getToDate());
            preparedStmtArgList.add(Types.INTEGER);
        }

        if (!ObjectUtils.isEmpty(criteria.getRuleType())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.rule_type IN ( ").append(queryBuilderHelper.createQuery(criteria.getRuleType())).append(" ) ");
            queryBuilderHelper.addToPreparedStatement(preparedStmtList, preparedStmtArgList, criteria.getRuleType());
        }

        if (!ObjectUtils.isEmpty(criteria.getCourtId())) {
            queryBuilderHelper.addClauseIfRequired(query, preparedStmtList);
            query.append(" jc.court_ids @> ?::jsonb ");
            preparedStmtList.add("[\"" + criteria.getCourtId() + "\"]");
            preparedStmtArgList.add(Types.OTHER);
        }

        return query.toString();

    }
}
