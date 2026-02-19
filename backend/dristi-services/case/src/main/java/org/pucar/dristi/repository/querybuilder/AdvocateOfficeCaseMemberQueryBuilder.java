package org.pucar.dristi.repository.querybuilder;

import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.advocateofficemember.CaseMemberSearchCriteria;
import org.pucar.dristi.web.models.enums.CaseMappingFilterStatus;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;
import java.util.Map;

@Component
public class AdvocateOfficeCaseMemberQueryBuilder {

    private static final String BASE_QUERY =
            "SELECT DISTINCT r.case_id, c.filingnumber, c.cmpnumber, " +
                    "c.courtcasenumber, c.casetitle, " +
                    "COALESCE(m.is_active, false) as is_active, " +
                    "COALESCE(m.created_by, r.createdby) as created_by, " +
                    "CASE WHEN m.is_active = true THEN 'ASSIGNED' ELSE 'UNASSIGNED' END as status " +
                    "FROM dristi_case_representatives r " +
                    "INNER JOIN dristi_cases c ON r.case_id = c.id " +
                    "LEFT JOIN dristi_advocate_office_case_member m " +
                    "ON r.case_id = m.case_id " +
                    "AND m.member_user_uuid = ? " +
                    "AND m.office_advocate_user_uuid = ? " +
                    "WHERE r.tenantid = ? AND r.advocateid = ? ";

    private static final String TOTAL_COUNT_QUERY =
            "SELECT COUNT(*) FROM ({baseQuery}) total_result";

    private static final String ORDERBY_CLAUSE =
            " ORDER BY {orderBy} {sortingOrder} ";

    private static final String DEFAULT_ORDERBY_CLAUSE =
            " ORDER BY created_by DESC ";

    private static final Map<String, String> SORT_COLUMN_MAP = Map.of(
            "createdTime", "created_by",
            "filingNumber", "filingnumber",
            "cmpNumber", "cmpnumber",
            "courtCaseNumber", "courtcasenumber",
            "caseTitle", "casetitle"
    );

    public String getCaseMembersSearchQuery(CaseMemberSearchCriteria criteria,
                                            List<Object> preparedStmtList,
                                            List<Integer> preparedStmtArgList) {

        if (criteria == null) {
            throw new IllegalArgumentException("CaseMemberSearchCriteria cannot be null");
        }

        StringBuilder query = new StringBuilder(BASE_QUERY);

        // JOIN parameters
        preparedStmtList.add(criteria.getMemberUserUuid());
        preparedStmtArgList.add(Types.VARCHAR);

        preparedStmtList.add(criteria.getOfficeAdvocateUserUuid());
        preparedStmtArgList.add(Types.VARCHAR);

        // WHERE parameters
        preparedStmtList.add(criteria.getTenantId());
        preparedStmtArgList.add(Types.VARCHAR);

        preparedStmtList.add(criteria.getAdvocateId());
        preparedStmtArgList.add(Types.VARCHAR);

        CaseMappingFilterStatus status =
                criteria.getCaseMappingFilterStatus() != null
                        ? criteria.getCaseMappingFilterStatus()
                        : CaseMappingFilterStatus.ALL_CASES;

        if (status == CaseMappingFilterStatus.ASSIGNED_CASES) {
            query.append(" AND m.is_active = true ");
        } else if (status == CaseMappingFilterStatus.UNASSIGNED_CASES) {
            query.append(" AND (m.is_active IS NULL OR m.is_active = false) ");
        }

        // Search filter
        if (criteria.getCaseSearchText() != null &&
                !criteria.getCaseSearchText().trim().isEmpty()) {

            String likePattern = "%" + criteria.getCaseSearchText().trim() + "%";

            query.append(" AND (")
                    .append("LOWER(c.courtcasenumber) LIKE LOWER(?) OR ")
                    .append("LOWER(c.filingnumber) LIKE LOWER(?) OR ")
                    .append("LOWER(c.cmpnumber) LIKE LOWER(?) OR ")
                    .append("LOWER(c.casetitle) LIKE LOWER(?)")
                    .append(") ");

            for (int i = 0; i < 4; i++) {
                preparedStmtList.add(likePattern);
                preparedStmtArgList.add(Types.VARCHAR);
            }
        }

        return query.toString();
    }

    public String addOrderByQuery(String query, Pagination pagination) {

        if (query == null) {
            return null;
        }

        if (pagination == null ||
                pagination.getSortBy() == null ||
                pagination.getOrder() == null) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        }

        if (pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        }

        String sortColumn = SORT_COLUMN_MAP.get(pagination.getSortBy());
        if (sortColumn == null) {
            return query + DEFAULT_ORDERBY_CLAUSE;
        }

        return query + ORDERBY_CLAUSE
                .replace("{orderBy}", sortColumn)
                .replace("{sortingOrder}",
                        pagination.getOrder().name().equalsIgnoreCase("ASC")
                                ? "ASC" : "DESC");
    }

    public String addPaginationQuery(String query,
                                     List<Object> preparedStmtList,
                                     Pagination pagination,
                                     List<Integer> preparedStmtArgList) {

        if (pagination == null) {
            return query;
        }

        Integer limit = pagination.getLimit() == null ? 10 : pagination.getLimit();
        Integer offset = pagination.getOffSet() == null ? 0 : pagination.getOffSet();

        preparedStmtList.add(limit);
        preparedStmtArgList.add(Types.INTEGER);

        preparedStmtList.add(offset);
        preparedStmtArgList.add(Types.INTEGER);

        return query + " LIMIT ? OFFSET ?";
    }

    public String getTotalCountQuery(String baseQuery) {
        return TOTAL_COUNT_QUERY.replace("{baseQuery}", baseQuery);
    }
}
