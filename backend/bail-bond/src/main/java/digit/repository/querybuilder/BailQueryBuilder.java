package digit.repository.querybuilder;

import digit.web.models.BailSearchCriteria;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

import static digit.config.ServiceConstants.BAIL_SEARCH_QUERY_EXCEPTION;


@Slf4j
@Component
public class BailQueryBuilder {

    private static final String BASE_TASK_QUERY = "SELECT bail.id as id, bail.tenantid as tenantid, bail.orderid as orderid, bail.createddate as createddate," +
            " bail.filingnumber as filingnumber, bail.id as bailid, bail.datecloseby as datecloseby, bail.dateclosed as dateclosed, bail.baildescription as baildescription, bail.cnrnumber as cnrnumber," +
            " bail.baildetails as baildetails, bail.assignedto as assignedto, bail.bailtype as bailtype, bail.assignedto as assignedto, bail.status as status, bail.isactive as isactive,bail.additionaldetails as additionaldetails, bail.createdby as createdby," +
            " bail.lastmodifiedby as lastmodifiedby, bail.createdtime as createdtime, bail.lastmodifiedtime as lastmodifiedtime ,c.caseTitle as caseName , o.orderType as orderType, c.cmpNumber as cmpNumber, c.courtId as courtId , c.courtCaseNumber as courtCaseNumber";

    private static final String FROM_TASK_TABLE = " FROM dristi_bail bail";
    private static final String TOTAL_COUNT_QUERY = " SELECT COUNT(*) from ({baseQuery}) AS total_count ";
    private static final String ORDER_BY_CLAUSE = " ORDER BY {orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY createdtime DESC ";
    private static final String PAGINATION_QUERY = " LIMIT ? OFFSET ? ";
    private static final String DOCUMENT_LEFT_JOIN = " LEFT JOIN dristi_bail_document dtd ON bail.id = dtd.bail_id ";
    private static final String SURETY_LEFT_JOIN = " LEFT JOIN dristi_surety srt ON bail.id = srt.bail_id ";

    public String getBailSearchQuery(BailSearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_TASK_QUERY);
            query.append(FROM_TASK_TABLE);
            query.append(DOCUMENT_LEFT_JOIN);
            query.append(SURETY_LEFT_JOIN);
            getWhereFields(criteria, query, preparedStmtList,preparedStmtArgList);
            return query.toString();
        } catch (Exception e) {
            log.error("Error while building bail search query {}", e.getMessage());
            throw new CustomException(BAIL_SEARCH_QUERY_EXCEPTION, "Error occurred while building the bail search query: " + e.getMessage());
        }
    }

    public String addPaginationQuery(String query, Pagination pagination, List<Object> preparedStatementList) {
        preparedStatementList.add(pagination.getLimit());
        preparedStatementList.add(pagination.getOffSet());
        return query + PAGINATION_QUERY;
    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isPaginationInvalid(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDER_BY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }

    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }

    private void getWhereFields(BailSearchCriteria criteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        boolean firstCriteria = true; // To check if it's the first criteria
        firstCriteria = addBailCriteria(criteria.getCourtId(), query, firstCriteria, "bail.courtId = ?", preparedStmtList, preparedStmtArgList);
        firstCriteria = addBailCriteria(criteria.getBailId(), query, firstCriteria, "bail.courtId = ?", preparedStmtList, preparedStmtArgList);
        firstCriteria = addBailCriteria(criteria.getFilingNumber(), query, firstCriteria, "bail.courtId = ?", preparedStmtList, preparedStmtArgList);
        firstCriteria = addBailCriteria(criteria.getTenantId(), query, firstCriteria, "bail.courtId = ?", preparedStmtList, preparedStmtArgList);
        firstCriteria = addBailCriteria(criteria.getCnrNumber(), query, firstCriteria, "bail.courtId = ?", preparedStmtList, preparedStmtArgList);

    }

    private boolean addBailCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
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