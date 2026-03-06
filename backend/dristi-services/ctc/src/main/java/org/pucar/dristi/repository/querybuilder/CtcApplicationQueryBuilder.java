package org.pucar.dristi.repository.querybuilder;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.CtcApplicationSearchCriteria;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.stereotype.Service;

import java.sql.Types;
import java.util.List;

@Service
@Slf4j
public class CtcApplicationQueryBuilder {

    private static final String BASE_QUERY = """
        SELECT id, ctc_application_number, tenant_id, case_number, case_title, filing_number, cnr_number, court_id, applicant_name, mobile_number, is_party_to_case, party_designation,affidavit_document, selected_case_bundle, case_bundles, total_pages, status, judge_comments,created_by, last_modified_by, created_time, last_modified_time FROM dristi_ctc_applications ctc""";

    private static final String COUNT_QUERY = """
        SELECT COUNT(*) 
        FROM dristi_ctc_applications
        """;

    private static final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY ctc.created_time DESC";
    private static final String ORDERBY_CLAUSE = " ORDER BY {orderBy} {sortingOrder}";

    public String getCtcApplicationsQuery(CtcApplicationSearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_QUERY);
            boolean firstCriteria = true;
            if (criteria != null) {
                firstCriteria = addCriteria(criteria.getCourtId(), query, firstCriteria, "ctc.court_id = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);
                firstCriteria = addCriteria(criteria.getTenantId(), query, firstCriteria, "ctc.tenant_id = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);
                firstCriteria = addSearchByCaseNumberAnTitleCriteria(criteria, query, firstCriteria, preparedStmtList, preparedStmtArgList);
                firstCriteria = addCriteria(criteria.getCtcApplicationNumber(), query, firstCriteria, "ctc.ctc_application_number = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);
                firstCriteria = addCriteria(criteria.getFilingNumber(), query, firstCriteria, "ctc.filing_number = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);
                addCriteria(criteria.getStatus(), query, firstCriteria, "ctc.status = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building ctc application search query :: {}", e.toString());
            throw new CustomException("CTC_SEARCH_QUERY_EXCEPTION", "Exception occurred while building the ctc application search query: " + e.getMessage());
        }
    }

    private boolean addSearchByCaseNumberAnTitleCriteria(CtcApplicationSearchCriteria criteria, StringBuilder query, boolean firstCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria.getSearchByCaseNumberAnTitle() != null && !criteria.getSearchByCaseNumberAnTitle().isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(" (LOWER(case_number) LIKE LOWER(?) OR LOWER(case_title) LIKE LOWER(?)) ");
            for (int i = 0; i < 2; i++) {
                preparedStmtList.add("%" + criteria.getSearchByCaseNumberAnTitle() + "%");
                preparedStmtArgList.add(Types.VARCHAR);
            }
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private boolean addCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, int type) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            preparedStmtList.add(criteria);
            preparedStmtArgList.add(type);
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

    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }

    public String addPaginationQuery(String query, List<Object> preparedStatementList, Pagination pagination, List<Integer> preparedStmtArgList) {
        preparedStatementList.add(pagination.getLimit());
        preparedStmtArgList.add(Types.INTEGER);

        preparedStatementList.add(pagination.getOffSet());
        preparedStmtArgList.add(Types.INTEGER);
        return query + " LIMIT ? OFFSET ?";

    }

    public String addOrderByQuery(String query, Pagination pagination) {
        if (isEmptyPagination(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        } else {
            query = query + ORDERBY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    public String addOrderByQueryForLitigants(String query) {
        return query + " ORDER BY COALESCE((ltg.additionaldetails->>'currentPosition')::int, 999999);";
    }

    private boolean isEmptyPagination(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }
}
