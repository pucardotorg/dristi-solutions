package digit.repository.querybuilder;

import digit.web.models.MemberSearchCriteria;
import digit.web.models.Pagination;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

import static digit.config.ServiceConstants.MEMBER_SEARCH_QUERY_EXCEPTION;
import static digit.config.ServiceConstants.MEMBER_SEARCH_QUERY_EXCEPTION_MESSAGE;

@Component
@Slf4j
public class AdvocateOfficeQueryBuilder {

    private static final String BASE_MEMBER_QUERY = "SELECT " +
            "member.id as id, " +
            "member.tenant_id as tenant_id, " +
            "member.office_advocate_user_uuid as office_advocate_user_uuid, " +
            "member.office_advocate_id as office_advocate_id, " +
            "member.office_advocate_name as office_advocate_name, " +
            "member.member_type as member_type, " +
            "member.member_user_uuid as member_user_uuid, " +
            "member.member_id as member_id, " +
            "member.member_name as member_name, " +
            "member.member_mobile_number as member_mobile_number, " +
            "member.member_email as member_email, " +
            "member.access_type as access_type, " +
            "member.allow_case_create as allow_case_create, " +
            "member.add_new_cases_automatically as add_new_cases_automatically, " +
            "member.is_active as is_active, " +
            "member.created_by as created_by, " +
            "member.last_modified_by as last_modified_by, " +
            "member.created_time as created_time, " +
            "member.last_modified_time as last_modified_time ";

    private static final String FROM_MEMBER_TABLE = " FROM dristi_advocate_office_member member";

    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY member.created_time DESC ";
    private static final String ORDERBY_CLAUSE = " ORDER BY member.{orderBy} {sortingOrder} ";
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

    public String getMemberSearchQuery(MemberSearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_MEMBER_QUERY);
            query.append(FROM_MEMBER_TABLE);
            boolean firstCriteria = true;

            // Default behavior: if isActive is not provided, search only active members
            Boolean isActive = criteria.getIsActive() != null ? criteria.getIsActive() : Boolean.TRUE;
            firstCriteria = addBooleanCriteria(isActive, query, firstCriteria, "member.is_active = ?", preparedStmtList, preparedStmtArgList);

            firstCriteria = addCriteria(criteria.getOfficeAdvocateUserUuid() != null ? criteria.getOfficeAdvocateUserUuid().toString() : null,
                    query, firstCriteria, "member.office_advocate_user_uuid = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(criteria.getOfficeAdvocateId() != null ? criteria.getOfficeAdvocateId().toString() : null,
                    query, firstCriteria, "member.office_advocate_id = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(criteria.getMemberType() != null ? criteria.getMemberType().name() : null,
                    query, firstCriteria, "member.member_type = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(criteria.getMemberUserUuid() != null ? criteria.getMemberUserUuid().toString() : null,
                    query, firstCriteria, "member.member_user_uuid = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(criteria.getMemberId() != null ? criteria.getMemberId().toString() : null,
                    query, firstCriteria, "member.member_id = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(criteria.getMemberName(),
                    query, firstCriteria, "member.member_name ILIKE ?", preparedStmtList, preparedStmtArgList, true);
            addCriteria(criteria.getMemberMobileNumber(),
                    query, firstCriteria, "member.member_mobile_number = ?", preparedStmtList, preparedStmtArgList);

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building member search query :: {}", e.toString());
            throw new CustomException(MEMBER_SEARCH_QUERY_EXCEPTION, MEMBER_SEARCH_QUERY_EXCEPTION_MESSAGE + e.getMessage());
        }
    }

    private boolean addBooleanCriteria(Boolean criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            preparedStmtList.add(criteria);
            preparedStmtArgList.add(Types.BOOLEAN);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private boolean addCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        return addCriteria(criteria, query, firstCriteria, str, preparedStmtList, preparedStmtArgList, false);
    }

    private boolean addCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, boolean isLike) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            if (isLike) {
                preparedStmtList.add("%" + criteria + "%");
            } else {
                preparedStmtList.add(criteria);
            }
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
