package digit.repository.querybuilder;

import digit.web.models.Bail;
import digit.web.models.BailCriteria;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BailQueryBuilder {
    private static final String BASE_BAIL_QUERY = "SELECT * FROM dristi_bail WHERE 1=1 ";
    private static final String DOCUMENT_SELECT_QUERY = "SELECT doc.id as id, doc.documenttype as documenttype, doc.filestore as filestore, doc.documentuid as documentuid, doc.additionaldetails as additionaldetails, doc.bailid as bailid, doc.isactive as isactive ";
    private static final String FROM_DOCUMENTS_TABLE = " FROM dristi_bail_document doc";
    private static final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY createdtime DESC ";
    private static final String ORDERBY_CLAUSE = " ORDER BY {orderBy} {sortingOrder} ";

    public String getBailSearchQuery(List<Object> preparedStmtList, List<BailCriteria> criteriaList, List<Integer> preparedStmtArgList) {
        StringBuilder query = new StringBuilder(BASE_BAIL_QUERY);
        for (BailCriteria criteria : criteriaList) {
            addCriteriaString(criteria.getId(), query, " AND id = ?", preparedStmtList, preparedStmtArgList, criteria.getId());
            addCriteriaString(criteria.getTenantId(), query, " AND tenantId = ?", preparedStmtList, preparedStmtArgList, criteria.getTenantId());
            addCriteriaString(criteria.getCaseId(), query, " AND caseId = ?", preparedStmtList, preparedStmtArgList, criteria.getCaseId());
            addCriteriaDouble(criteria.getBailAmount(), query, " AND bailAmount = ?", preparedStmtList, preparedStmtArgList);
            addCriteriaString(criteria.getBailType(), query, " AND bailType = ?", preparedStmtList, preparedStmtArgList, criteria.getBailType());
            addCriteriaLong(criteria.getStartDate(), query, " AND startDate >= ?", preparedStmtList, preparedStmtArgList);
            addCriteriaLong(criteria.getEndDate(), query, " AND endDate <= ?", preparedStmtList, preparedStmtArgList);
            addCriteriaBoolean(criteria.getIsActive(), query, " AND isActive = ?", preparedStmtList, preparedStmtArgList);
            addCriteriaString(criteria.getAccusedId(), query, " AND accusedId = ?", preparedStmtList, preparedStmtArgList, criteria.getAccusedId());
            addCriteriaString(criteria.getAdvocateId(), query, " AND advocateId = ?", preparedStmtList, preparedStmtArgList, criteria.getAdvocateId());
            addCriteriaSuretyIds(criteria.getSuretyIds(), query, " AND suretyIds && ? ", preparedStmtList, preparedStmtArgList);
        }
        return query.toString();
    }

    void addCriteriaString(String value, StringBuilder query, String clause, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, Object param) {
        if (value != null && !value.isEmpty()) {
            query.append(clause);
            preparedStmtList.add(param);
            preparedStmtArgList.add(Types.VARCHAR);
        }
    }

    void addCriteriaDouble(Double value, StringBuilder query, String clause, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (value != null) {
            query.append(clause);
            preparedStmtList.add(value);
            preparedStmtArgList.add(Types.DOUBLE);
        }
    }

    void addCriteriaLong(Long value, StringBuilder query, String clause, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (value != null) {
            query.append(clause);
            preparedStmtList.add(value);
            preparedStmtArgList.add(Types.BIGINT);
        }
    }

    void addCriteriaBoolean(Boolean value, StringBuilder query, String clause, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (value != null) {
            query.append(clause);
            preparedStmtList.add(value);
            preparedStmtArgList.add(Types.BOOLEAN);
        }
    }

    void addCriteriaSuretyIds(List<String> suretyIds, StringBuilder query, String clause, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (suretyIds != null && !suretyIds.isEmpty()) {
            query.append(clause);
            preparedStmtList.add(suretyIds.toArray(new String[0]));
            preparedStmtArgList.add(Types.ARRAY);
        }
    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDERBY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

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

    public String getDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgListDoc) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.bailid IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgListDoc.add(Types.VARCHAR));
            }
            return query.toString();
        } catch (Exception e) {
            log.error("Error while building document search query");
            throw new CustomException("DOCUMENT_SEARCH_QUERY_EXCEPTION", "Error occurred while building the query: " + e.getMessage());
        }
    }
}


