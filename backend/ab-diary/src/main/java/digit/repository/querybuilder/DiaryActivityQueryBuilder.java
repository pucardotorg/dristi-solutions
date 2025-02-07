package digit.repository.querybuilder;

import digit.web.models.CaseDiaryActivitySearchCriteria;
import digit.web.models.Pagination;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class DiaryActivityQueryBuilder {

    private static final String BASE_DIARY_ACTIVITY_QUERY = "SELECT da.id as id,da.tenant_id as tenantId,da.entry_date as entryDate," +
            "da.additional_details as additionalDetails,da.judge_id as judgeId,da.created_by as createdBy,da.created_time as createdTime," +
            "da.last_modified_by as lastModifiedBy,da.last_modified_time as lastModifiedTime ";

    private static final String FROM_DIARY_ACTIVITY_TABLE = "FROM dristi_adiary_activities as da";

    private static final String DEFAULT_ORDER_BY_CLAUSE = " ORDER BY created_time DESC ";

    private static final String ORDER_BY_CLAUSE = " ORDER BY {orderBy} {sortingOrder} ";

    private static final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";

    public String getDiaryActivityQuery(CaseDiaryActivitySearchCriteria searchCriteria, List<Object> preparedStatementValues, List<Integer> preparedStatementTypeValues) {

        StringBuilder query = new StringBuilder(BASE_DIARY_ACTIVITY_QUERY);

        query.append(FROM_DIARY_ACTIVITY_TABLE);

        boolean isFirstCriteria = true;

        if (searchCriteria != null) {
            if (searchCriteria.getTenantId() != null) {
                addWhereClause(query,isFirstCriteria);
                query.append("da.tenant_id = ?");
                preparedStatementValues.add(searchCriteria.getTenantId());
                preparedStatementTypeValues.add(Types.VARCHAR);
                isFirstCriteria = false;
            }
            if (searchCriteria.getJudgeId() != null) {
                addWhereClause(query,isFirstCriteria);
                query.append("da.judge_id = ?");
                preparedStatementValues.add(searchCriteria.getJudgeId());
                preparedStatementTypeValues.add(Types.VARCHAR);
                isFirstCriteria = false;
            }
            if (searchCriteria.getFromDate() != null && searchCriteria.getToDate() != null) {
                addWhereClause(query,isFirstCriteria);
                query.append("da.entry_date BETWEEN ? AND ?");
                preparedStatementValues.add(searchCriteria.getFromDate());
                preparedStatementTypeValues.add(Types.BIGINT);
                preparedStatementValues.add(searchCriteria.getToDate());
                preparedStatementTypeValues.add(Types.BIGINT);
            }

        }

        return query.toString();
    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isPaginationInvalid(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDER_BY_CLAUSE;
        } else {
            query = query + ORDER_BY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }

    private void addWhereClause(StringBuilder query, boolean firstCriteria) {
        if (firstCriteria) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }

    public String addPaginationQuery(String diaryEntryQuery, List<Object> preparedStmtList, @Valid Pagination pagination, List<Integer> preparedStmtArgList) {

        preparedStmtList.add(pagination.getLimit());
        preparedStmtArgList.add(Types.INTEGER);

        preparedStmtList.add(pagination.getOffSet());
        preparedStmtArgList.add(Types.INTEGER);
        return diaryEntryQuery + " LIMIT ? OFFSET ?";
    }

}
