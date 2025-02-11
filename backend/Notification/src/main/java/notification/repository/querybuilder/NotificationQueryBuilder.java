package notification.repository.querybuilder;

import notification.web.models.NotificationCriteria;
import notification.web.models.Pagination;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.sql.Types;
import java.util.List;

@Component
public class NotificationQueryBuilder {

    private static final String SELECT = " SELECT ";
    private static final String CTE_TABLE = " WITH paginated_notification AS (%s) ";
    private static final String BASE_QUERY_NOTIFICATION = " id, tenantId, notificationType, caseNumber, courtId, notificationNumber, createdDate, issuedBy, status, comment, isActive, notificationDetails, additionalDetails, createdBy, lastModifiedBy, createdTime, lastModifiedTime ";
    private static final String FROM_NOTIFICATION = " FROM dristi_notification ";
    private static final String WHERE = " WHERE ";
    private static final String AND = " AND ";
    private static final String BASE_QUERY_NOTIFICATION_DOCUMENT = " ,nd.id as documentId, nd.fileStore as fileStore, nd.documentUid as documentUid, nd.documentType as documentType, nd.notification_id as notificationId, nd.additionalDetails as documentAdditionalDetails";

    private static final String FROM_CTE_TABLE = " paginated_notification pn";
    private static final String CTE_QUERY_NOTIFICATION = " pn.id, pn.tenantId, pn.notificationType, pn.caseNumber, pn.courtId, pn.notificationNumber, pn.createdDate, pn.issuedBy, pn.status, pn.comment, pn.isActive, pn.notificationDetails, pn.additionalDetails, pn.createdBy, pn.lastModifiedBy, pn.createdTime, pn.lastModifiedTime ";
    private static final String NOTIFICATION_DOCUMENT_TABLE = " dristi_notification_document nd ";
    private static final String LIMIT = "LIMIT ?";
    private static final String ORDER_BY = " ORDER BY ";
    private static final String OFFSET = " OFFSET ?";
    private static final String ON = " ON ";
    private static final String LEFT_JOIN = " LEFT JOIN ";

    private static final String ORDERBY_CLAUSE = " ORDER BY pn.{orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY cases.createdDate DESC ";
    private  static  final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";



    /**
     * Returns a query string for fetching paginated notifications. The query is formed by
     * first creating a Common Table Expression (CTE) for the base query, then joining the
     * CTE with the notification document table.
     *
     * @param baseQuery the base query for fetching notifications
     * @param pagination the pagination object
     * @param preparedStmtList the list of prepared statement arguments
     * @param preparedStmtArgList the list of argument types for the prepared statement
     * @return the query string
     */
    public String getNotificationPaginatedQuery(String baseQuery, Pagination pagination, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {

        String sb = CTE_TABLE + SELECT + CTE_QUERY_NOTIFICATION +
                BASE_QUERY_NOTIFICATION_DOCUMENT +
                FROM_CTE_TABLE +
                LEFT_JOIN + NOTIFICATION_DOCUMENT_TABLE + ON +
                " pn.id = nd.notification_id ";

        String paginatedQuery = addPaginationQuery(baseQuery, preparedStmtList, pagination, preparedStmtArgList);

        return addOrderByQuery(String.format(sb, paginatedQuery), pagination);
    }


    /**
     * Creates a base query for fetching notifications based on given criteria and stores the arguments to be used in the prepared statement.
     * @param criteria the criteria to search notifications
     * @param preparedStmtList the list of prepared statement arguments
     * @param preparedStmtArgList the list of argument types for the prepared statement
     * @return the base query string
     */
    public String getBaseNotificationQuery(NotificationCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder uri = new StringBuilder();
        StringBuilder whereCondition = new StringBuilder();

        addWhereCondition(criteria, whereCondition, preparedStmtList, preparedStmtArgList);

        uri.append(SELECT).append(BASE_QUERY_NOTIFICATION)
                .append(FROM_NOTIFICATION).append(whereCondition);

        return uri.toString();
    }

    /**
     * Returns a query string that fetches the total count of notifications based on the given base query.
     * The query string is a wrapper around the base query and uses a COUNT(*) to fetch the total count.
     *
     * @param baseQuery the base query to fetch notifications
     * @return the query string
     */
    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }


    /**
     * Appends the WHERE condition of the query based on the given object and the existing condition
     *
     * @param obj                 the object to get the WHERE condition from
     * @param sb                  the StringBuilder to append the WHERE condition to
     * @param preparedStmtList    the list of prepared statement parameters
     * @param preparedStmtArgList the list of prepared statement argument types
     */
    private void addWhereCondition(Object obj, StringBuilder sb, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (obj == null || sb == null) {
            throw new CustomException("Object and StringBuilder cannot be null", "");
        }

        Class<?> clazz = obj.getClass();
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            try {
                if (field.get(obj) != null) {
                    addClause(sb);
                    sb.append(field.getName()).append(" = ?");
                    preparedStmtList.add(field.get(obj));
                    preparedStmtArgList.add(Types.VARCHAR); // here for this use case its varchar only
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException("Failed to access field: " + field.getName(), e);
            }
        }

    }

    /**
     * Appends the appropriate SQL clause ('WHERE' or 'AND') to the StringBuilder based on its current state.
     * If the StringBuilder is empty, 'WHERE' is appended. Otherwise, 'AND' is appended.
     *
     * @param sb the StringBuilder to append the clause to
     */
    private void addClause(StringBuilder sb) {
        if (sb.isEmpty()) {
            sb.append(WHERE);
        } else {
            sb.append(AND);
        }
    }


    /**
     * Adds the pagination query to the given query. It appends the limit and offset parameters to the query and adds the corresponding values to the prepared statement list.
     *
     * @param query                 the query to append the pagination query to
     * @param preparedStatementList the list of prepared statement parameters
     * @param pagination            the pagination object containing the limit and offset values
     * @param preparedStmtArgList   the list of prepared statement argument types
     * @return the query with the pagination query appended
     */
    private String addPaginationQuery(String query, List<Object> preparedStatementList, Pagination pagination, List<Integer> preparedStmtArgList) {
        preparedStatementList.add(pagination.getLimit());
        preparedStmtArgList.add(Types.INTEGER);

        preparedStatementList.add(pagination.getOffSet());
        preparedStmtArgList.add(Types.INTEGER);
        return query + LIMIT + OFFSET;

    }

    /**
     * Adds an ORDER BY clause to the given SQL query based on the pagination parameters.
     * If the pagination is empty or the sortBy field contains a semicolon, a default ORDER BY clause is used.
     * Otherwise, the query is modified to include the specified orderBy and sortingOrder from the pagination.
     *
     * @param query      the SQL query to which the ORDER BY clause should be appended
     * @param pagination the pagination object containing sorting information
     * @return the modified SQL query with the ORDER BY clause
     */

    private String addOrderByQuery(String query, Pagination pagination) {
        if (isEmptyPagination(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDERBY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    private boolean isEmptyPagination(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }


}
