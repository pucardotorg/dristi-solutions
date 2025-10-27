package digit.repository.querybuilder;

import digit.web.models.Pagination;
import digit.web.models.TaskSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class TaskManagementQueryBuilder {

    private static final String BASE_CASE_QUERY = "SELECT " +
            "task.id as id, " +
            "task.case_filing_number as caseFilingNumber, " +
            "task.court_id as courtId, " +
            "task.status as status, " +
            "task.order_number as orderNumber, " +
            "task.party_details as partyDetails, " +
            "task.additional_details as additionalDetails, " +
            "task.tenant_id as tenantId, " +
            "task.created_by as createdBy, " +
            "task.last_modified_by as lastModifiedBy, " +
            "task.created_time as createdTime, " +
            "task.last_modified_time as lastModifiedTime";
            
    private static final String FROM_TASK_TABLE = " FROM dristi_task_management task";

    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY task.created_time DESC ";
    private static final String ORDERBY_CLAUSE = " ORDER BY task.{orderBy} {sortingOrder} ";
    private static final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";


    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }

    public String addPaginationQuery(String query, Pagination pagination, List<Object> preparedStatementList, List<Integer> preparedStatementArgList) {
        preparedStatementList.add(pagination.getLimit());
        preparedStatementArgList.add(Types.DOUBLE);

        preparedStatementList.add(pagination.getOffSet());
        preparedStatementArgList.add(Types.DOUBLE);
        return query + " LIMIT ? OFFSET ?";
    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isPaginationInvalid(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDERBY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }

    public String getTaskSearchQuery(TaskSearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {

            StringBuilder query = new StringBuilder(BASE_CASE_QUERY);
            query.append(FROM_TASK_TABLE);
            boolean firstCriteria = true; // To check if it's the first criteria

            firstCriteria = addTaskCriteria(criteria.getOrderNumber(), query, firstCriteria, "task.order_number = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addTaskCriteria(criteria.getFilingNumber(), query, firstCriteria, "task.case_filing_number = ?", preparedStmtList, preparedStmtArgList);
            addTaskCriteria(String.valueOf(criteria.getId()), query, firstCriteria, "task.id = ?", preparedStmtList, preparedStmtArgList);

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building task search query :: {}", e.toString());
            throw new CustomException("TASK_SEARCH_QUERY_EXCEPTION", "Exception occurred while building the task search query: " + e.getMessage());
        }
    }

    private boolean addTaskCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            preparedStmtList.add(criteria);
            preparedStmtArgList.add(Types.VARCHAR);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private void addClauseIfRequired(StringBuilder query, boolean isFirstCriteria) {
        if (isFirstCriteria) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

}