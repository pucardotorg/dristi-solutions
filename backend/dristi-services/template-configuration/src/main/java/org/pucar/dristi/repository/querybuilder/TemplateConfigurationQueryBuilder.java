package org.pucar.dristi.repository.querybuilder;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.TemplateConfigurationCriteria;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.TEMPLATE_SEARCH_EXCEPTION;

@Component
@Slf4j
public class TemplateConfigurationQueryBuilder {

    private static final String BASE_TEMPLATE_QUERY = " SELECT tc.id as id, tc.tenant_id as tenant_id, tc.filing_number as filing_number, " +
            "tc.court_id as court_id, tc.is_active as is_active, tc.process_title as process_title, tc.process_text as process_text, tc.addressee_name as addressee_name," +
            "tc.is_cover_letter_required as is_cover_letter_required, tc.addressee as addressee, " +
            "tc.order_text as order_text, tc.cover_letter_text as cover_letter_text, " +
            "tc.created_by as created_by, tc.created_time as created_time, " +
            "tc.last_modified_by as last_modified_by, tc.last_modified_time as last_modified_time ";

    private static final String FROM_TEMPLATE_TABLE = " FROM dristi_template_configuration tc";


    private static final String ORDERBY_CLAUSE = " ORDER BY tc.{orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY tc.created_time DESC ";

    private  static  final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";

    public String getTemplateConfigurationSearchQuery(TemplateConfigurationCriteria criteria, List<Object> preparedStmtList,List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_TEMPLATE_QUERY);
            query.append(FROM_TEMPLATE_TABLE);

            boolean firstCriteria = true;

            // Add filters based on criteria
            if (criteria.getId() != null && !criteria.getId().isEmpty()) {
                addClauseIfRequired(query, firstCriteria);
                query.append("tc.id = ?");
                preparedStmtList.add(criteria.getId());
                preparedStmtArgList.add(Types.VARCHAR);
                firstCriteria = false;
            }

            if (criteria.getTenantId() != null && !criteria.getTenantId().isEmpty()) {
                addClauseIfRequired(query, firstCriteria);
                query.append("tc.tenant_id = ?");
                preparedStmtList.add(criteria.getTenantId());
                preparedStmtArgList.add(Types.VARCHAR);
                firstCriteria = false;
            }

            if (criteria.getCourtId() != null && !criteria.getCourtId().isEmpty()) {
                addClauseIfRequired(query, firstCriteria);
                query.append("tc.court_id = ?");
                preparedStmtList.add(criteria.getCourtId());
                preparedStmtArgList.add(Types.VARCHAR);
                firstCriteria = false;
            }

            if (criteria.getFilingNumber() != null && !criteria.getFilingNumber().isEmpty()) {
                addClauseIfRequired(query, firstCriteria);
                query.append("tc.filing_number = ?");
                preparedStmtList.add(criteria.getFilingNumber());
                preparedStmtArgList.add(Types.VARCHAR);
                firstCriteria = false;
            }

            return query.toString();

        } catch (Exception e) {
            log.error("Error while building template configuration search query: {}", e.getMessage());
            throw new CustomException(TEMPLATE_SEARCH_EXCEPTION, "Error occurred while building the template configuration search query: " + e.getMessage());
        }
    }

    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isPaginationInvalid(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDERBY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    public String addPaginationQuery(String query, Pagination pagination, List<Object> preparedStatementList, List<Integer> preparedStatementArgList) {
        preparedStatementList.add(pagination.getLimit());
        preparedStatementArgList.add(Types.DOUBLE);

        preparedStatementList.add(pagination.getOffSet());
        preparedStatementArgList.add(Types.DOUBLE);
        return query + " LIMIT ? OFFSET ?";
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }

    private void addClauseIfRequired(StringBuilder query, boolean firstCriteria) {
        if (firstCriteria) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }
}
