package digit.repository.querybuilder;

import digit.web.models.CauseListSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.sql.Types;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@Slf4j
public class CauseListQueryBuilder {

    private final String BASE_APPLICATION_QUERY = "SELECT cl.court_id, cl.judge_id, cl.tenant_id, cl.case_id, cl.case_title, cl.litigant_names, cl.hearing_type, cl.tentative_slot, cl.case_date, cl.application_number, cl.case_number ";

    private static final String FROM_TABLES = " FROM cause_list cl ";

    private final String ORDER_BY = " ORDER BY cl.hearing_type";

    public String getCauseListQuery(CauseListSearchCriteria searchCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtListArgs) {
        StringBuilder query = new StringBuilder(BASE_APPLICATION_QUERY);
        query.append(FROM_TABLES);

        if (!ObjectUtils.isEmpty(searchCriteria.getCourtId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" cl.court_id = ? ");
            preparedStmtList.add(searchCriteria.getCourtId());
            preparedStmtListArgs.add(Types.VARCHAR);
        }
        if(!CollectionUtils.isEmpty(searchCriteria.getJudgeIds())){
            addClauseIfRequired(query, preparedStmtList);
            query.append(" cl.judge_id IN ( ").append(createQuery(searchCriteria.getJudgeIds())).append(" ) ");
            addToPreparedStatement(preparedStmtList, preparedStmtListArgs, searchCriteria.getJudgeIds());
        }
        if(!CollectionUtils.isEmpty(searchCriteria.getCaseIds())){
            addClauseIfRequired(query, preparedStmtList);
            query.append(" cl.case_id IN ( ").append(createQuery(searchCriteria.getCaseIds())).append(" ) ");
            addToPreparedStatement(preparedStmtList, preparedStmtListArgs, searchCriteria.getCaseIds());
        }
        if (!ObjectUtils.isEmpty(searchCriteria.getSearchDate())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" TO_DATE(cl.case_date,  'yyyy-mm-dd') = ? ");
            preparedStmtList.add(searchCriteria.getSearchDate());
            preparedStmtListArgs.add(Types.VARCHAR);
        } else {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" TO_DATE(cl.case_date,  'yyyy-mm-dd') = ? ");
            preparedStmtList.add(LocalDate.now());
            preparedStmtListArgs.add(Types.VARCHAR);
        }
        query.append(ORDER_BY);

        return query.toString();
    }

    private void addClauseIfRequired(StringBuilder query, List<Object> preparedStmtList) {
        if (preparedStmtList.isEmpty()) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    private String createQuery(List<String> ids) {
        StringBuilder builder = new StringBuilder();
        int length = ids.size();
        for (int i = 0; i < length; i++) {
            builder.append(" ?");
            if (i != length - 1)
                builder.append(",");
        }
        return builder.toString();
    }

    private void addToPreparedStatement(List<Object> preparedStmtList, List<Integer> preparedStmtListArgs,List<String> ids) {
        ids.forEach(id -> {
            preparedStmtList.add(id);
            preparedStmtListArgs.add(Types.VARCHAR);
        });
    }
}
