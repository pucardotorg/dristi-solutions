package digit.repository.querybuilder;

import digit.web.models.DigitalizedDocumentSearchCriteria;
import digit.web.models.Pagination;
import digit.web.models.TypeEnum;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class DigitalizedDocumentQueryBuilder {

    private static final String BASE_QUERY = "SELECT dd.id as id, dd.type as type, dd.document_number as document_number," +
            " dd.case_id as case_id, dd.case_filing_number as case_filing_number, dd.plea_details as plea_details," +
            " dd.examination_of_accused_details as examination_of_accused_details, dd.mediation_details as mediation_details," +
            " dd.additional_details as additional_details, dd.status as status, dd.documents as documents, dd.order_number as order_number, dd.order_item_id as order_item_id," +
            " dd.tenant_id as tenant_id, dd.court_id as court_id, dd.shortened_url as shortened_url, dd.created_by as created_by, dd.created_time as created_time," +
            " dd.last_modified_by as last_modified_by, dd.last_modified_time as last_modified_time" +
            " FROM digitalized_document dd";

    private static final String BASE_EXIST_QUERY = "SELECT COUNT(*) FROM digitalized_document dd";

    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY dd.created_time DESC ";
    private static final String ORDERBY_CLAUSE = " ORDER BY dd.{orderBy} {sortingOrder} ";
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

    public String getDigitalizedDocumentSearchQuery(DigitalizedDocumentSearchCriteria criteria, List<Object> preparedStatementList, List<Integer> preparedStatementArgList) {
        try {
            // Extract only fields that exist in DigitalizedDocumentSearchCriteria
            String id = criteria.getId();
            String documentNumber = criteria.getDocumentNumber();
            TypeEnum type = criteria.getType();
            String status = criteria.getStatus();
            String tenantId = criteria.getTenantId();
            String courtId = criteria.getCourtId();
            String orderNumber = criteria.getOrderNumber();
            String orderItemId = criteria.getOrderItemId();
            String caseId = criteria.getCaseId();
            String caseFilingNumber = criteria.getCaseFilingNumber();

            StringBuilder query = new StringBuilder(BASE_QUERY);
            boolean firstCriteria = true;

            firstCriteria = addDigitalizedDocumentCriteria(id, query, firstCriteria, "dd.id = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(documentNumber, query, firstCriteria, "dd.document_number = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(type != null ? type.toString() : null, query, firstCriteria, "dd.type = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(status, query, firstCriteria, "dd.status = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(tenantId, query, firstCriteria, "dd.tenant_id = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(orderNumber, query, firstCriteria, "dd.order_number = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(orderItemId, query, firstCriteria, "dd.order_item_id = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(courtId, query, firstCriteria, "dd.court_id = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(caseId, query, firstCriteria, "dd.case_id = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(caseFilingNumber, query, firstCriteria, "dd.case_filing_number = ?", preparedStatementList, preparedStatementArgList);

            log.info("Final query: {}", query);
            log.info("Prepared statement list: {}", preparedStatementList);

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building digitalized document search query", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_SEARCH_QUERY_EXCEPTION", "Error occurred while building the digitalized document search query: " + e.getMessage());
        }
    }

    public String getDigitalizedDocumentExistQuery(DigitalizedDocumentSearchCriteria criteria, List<Object> preparedStatementList, List<Integer> preparedStatementArgList) {
        try {
            String id = criteria.getId();
            String documentNumber = criteria.getDocumentNumber();
            digit.web.models.TypeEnum type = criteria.getType();
            String tenantId = criteria.getTenantId();

            StringBuilder query = new StringBuilder(BASE_EXIST_QUERY);
            boolean firstCriteria = true;

            firstCriteria = addDigitalizedDocumentCriteria(id, query, firstCriteria, "dd.id = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(documentNumber, query, firstCriteria, "dd.document_number = ?", preparedStatementList, preparedStatementArgList);
            firstCriteria = addDigitalizedDocumentCriteria(type != null ? type.toString() : null, query, firstCriteria, "dd.type = ?", preparedStatementList, preparedStatementArgList);
            addDigitalizedDocumentCriteria(tenantId, query, firstCriteria, "dd.tenant_id = ?", preparedStatementList, preparedStatementArgList);

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building digitalized document exist query", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_EXIST_QUERY_EXCEPTION", "Error occurred while building the digitalized document exist query: " + e.getMessage());
        }
    }

    private boolean addDigitalizedDocumentCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
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

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isPaginationInvalid(pagination)) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDERBY_CLAUSE;
            return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
        }
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }
}
