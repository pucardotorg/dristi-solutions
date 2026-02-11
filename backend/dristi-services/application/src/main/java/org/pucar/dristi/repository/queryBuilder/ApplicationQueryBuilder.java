package org.pucar.dristi.repository.queryBuilder;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.ApplicationCriteria;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class ApplicationQueryBuilder {

    private static final String     BASE_APP_QUERY =
            " SELECT app.id as id, app.tenantid as tenantid, app.caseid as caseid, app.filingnumber as filingnumber, app.cnrnumber as cnrnumber," +
                    " app.referenceid as referenceid, app.createddate as createddate, app.applicationcreatedby as applicationcreatedby," +
                    " app.onbehalfof as onbehalfof, app.asuser as asuser, app.applicationtype as applicationtype, app.applicationnumber as applicationnumber," +
                    " app.statuteSection as statuteSection, app.issuedby as issuedby, app.status as status, app.courtId as courtId, app.comment as comment, app.isactive as isactive," +
                    " app.additionaldetails as additionaldetails,"+
                    " app.applicationcmpnumber as applicationcmpnumber,"+
                    " app.reason_for_application as reason_for_application,"+
                    " app.application_details as application_details,"+
                    " app.createdby as createdby," +
                    " app.lastmodifiedby as lastmodifiedby, app.createdtime as createdtime, app.lastmodifiedtime as lastmodifiedtime," +
                    " app.status as status ";

    private  static  final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";

    private static final String DOCUMENT_SELECT_QUERY_APP = "SELECT doc.id as id, doc.documenttype as documenttype, doc.filestore as filestore," +
            "doc.documentuid as documentuid, doc.additionaldetails as additionaldetails, doc.application_id as application_id, doc.documentorder as documentorder, doc.isactive as isactive";

    private static final String FROM_DOCUMENTS_TABLE = " FROM dristi_application_document doc";

    private static final String FROM_APP_TABLE = " FROM dristi_application app";
    private static final String ORDERBY_CLAUSE = " ORDER BY app.{orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY app.createdtime DESC ";
    private static final String BASE_APPLICATION_EXIST_QUERY = "SELECT COUNT(*) FROM dristi_application app";

    public String checkApplicationExistQuery(String filingNumber, String cnrNumber, String applicationNumber, List<Object> preparedStmtList) {
        try {
            StringBuilder query = new StringBuilder(BASE_APPLICATION_EXIST_QUERY);
            boolean firstCriteria = true; // To check if it's the first criteria

            firstCriteria = addCriteriaExist(filingNumber, query, firstCriteria, "app.filingNumber = ?", preparedStmtList);
            firstCriteria = addCriteriaExist(cnrNumber, query, firstCriteria, "app.cnrNumber = ?", preparedStmtList);
            addCriteriaExist(applicationNumber, query, firstCriteria, "app.applicationNumber = ?", preparedStmtList);

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building application exist query {}", e.getMessage());
            throw new CustomException(APPLICATION_EXIST_EXCEPTION, "Error occurred while building the application exist query: " + e.getMessage());
        }
    }

    public String getApplicationSearchQuery(ApplicationCriteria applicationCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, String userUuid, RequestInfo requestInfo) {
        try {
            StringBuilder query = new StringBuilder(BASE_APP_QUERY);
            query.append(FROM_APP_TABLE);

            boolean firstCriteria = true; // To check if it's the first criteria
            firstCriteria = addMultipleCriteria(applicationCriteria.getOnBehalfOf(), query, firstCriteria, preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getId(), query, firstCriteria, "app.id = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getFilingNumber(), query, firstCriteria, "app.filingNumber = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getApplicationType(), query, firstCriteria, "app.applicationType = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getCnrNumber(), query, firstCriteria, "app.cnrNumber = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getTenantId(), query, firstCriteria, "app.tenantId = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getStatus(), query, firstCriteria, "app.status = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getCourtId(), query, firstCriteria, "app.courtId = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getReferenceId(), query, firstCriteria, "app.referenceId = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addCriteria(applicationCriteria.getOwner()!=null?applicationCriteria.getOwner().toString():null, query, firstCriteria, "app.createdBy = ?", preparedStmtList,preparedStmtArgList);
            firstCriteria = addPartialCriteriaForApplicationCMPNumber(applicationCriteria.getApplicationCMPNumber(), query, firstCriteria, preparedStmtList,preparedStmtArgList);

            if (applicationCriteria.getIsFuzzySearch() == null || !applicationCriteria.getIsFuzzySearch()) {
                firstCriteria = addCriteria(applicationCriteria.getApplicationNumber() , query, firstCriteria, "LOWER(app.applicationNumber) = LOWER(?)", preparedStmtList, preparedStmtArgList);
            } else {
                firstCriteria = addPartialCriteria(applicationCriteria.getApplicationNumber(), query, firstCriteria, preparedStmtList,preparedStmtArgList);
            }

            // TODO : remove this, this is temporary fix (#5016)
            // --------- Exclude bail applications if isCaseBundle is true ----------
            if (Boolean.TRUE.equals(applicationCriteria.getIsHideBailCaseBundle())) {
                addClauseIfRequired(query, firstCriteria);
                query.append("app.applicationType != ?");
                preparedStmtList.add(REQUEST_FOR_BAIL);
                preparedStmtArgList.add(Types.VARCHAR);
                firstCriteria = false;
            }

            if (requestInfo != null && requestInfo.getUserInfo() != null && requestInfo.getUserInfo().getUuid() != null) {
                List<String> officeAdvocateUserUuids = applicationCriteria.getOfficeAdvocateUserUuids();
                boolean isAdvocateOrClerk = applicationCriteria.isAdvocate() || applicationCriteria.isClerk();
                boolean hasUserUuidsList = officeAdvocateUserUuids != null && !officeAdvocateUserUuids.isEmpty();

                addClauseIfRequired(query, firstCriteria);

                if (isAdvocateOrClerk && hasUserUuidsList) {
                    query.append("(app.status != 'DRAFT_IN_PROGRESS' OR (app.status = 'DRAFT_IN_PROGRESS' AND app.asuser IN (");
                    for (int i = 0; i < officeAdvocateUserUuids.size(); i++) {
                        query.append("?");
                        if (i < officeAdvocateUserUuids.size() - 1) {
                            query.append(", ");
                        }
                        preparedStmtList.add(officeAdvocateUserUuids.get(i));
                        preparedStmtArgList.add(Types.VARCHAR);
                    }
                    query.append(")))");
                } else {
                    query.append("(app.status != 'DRAFT_IN_PROGRESS' OR (app.status = 'DRAFT_IN_PROGRESS' AND app.createdBy = ?))");
                    preparedStmtList.add(userUuid);
                    preparedStmtArgList.add(Types.VARCHAR);
                }
                firstCriteria = false;
            }

            // TODO : remove this, this is temporary fix (#5016)
            // --------- REQUEST_FOR_BAIL visibility ----------
            List<String> officeAdvocateUserUuids = applicationCriteria.getOfficeAdvocateUserUuids();
            boolean isAdvocateOrClerk = applicationCriteria.isAdvocate() || applicationCriteria.isClerk();
            applyRequestForBailVisibility(
                    query, firstCriteria, userUuid, officeAdvocateUserUuids, isAdvocateOrClerk,
                    preparedStmtList, preparedStmtArgList);

            return query.toString();

        } catch (Exception e) {
            log.error("Error while building application search query", e);
            throw new CustomException(APPLICATION_SEARCH_QUERY_EXCEPTION, "Error occurred while building the application search query: " + e.getMessage());
        }
    }

    private void applyRequestForBailVisibility(StringBuilder query, boolean firstCriteria, String userUuid, List<String> userUuids, boolean isAdvocateOrClerk, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {

        // If user info is missing, do not restrict visibility
        if (userUuid == null || userUuid.isEmpty()) {
            return;
        }

        boolean hasUserUuidsList = userUuids != null && !userUuids.isEmpty();

        addClauseIfRequired(query, firstCriteria);

        query.append("(")
                .append("app.applicationType != ? ")
                .append("OR ")
                .append("(")
                .append("app.applicationType = ? ")
                .append("AND ")
                .append("(");

        preparedStmtList.add(REQUEST_FOR_BAIL);
        preparedStmtArgList.add(Types.VARCHAR);

        preparedStmtList.add(REQUEST_FOR_BAIL);
        preparedStmtArgList.add(Types.VARCHAR);

        if (isAdvocateOrClerk && hasUserUuidsList) {
            query.append("app.onBehalfOf ??| ?::text[] ");
            preparedStmtList.add(userUuids.toArray(new String[0]));
            preparedStmtArgList.add(Types.ARRAY);

            query.append("OR app.asuser IN (");
            for (int i = 0; i < userUuids.size(); i++) {
                query.append("?");
                if (i < userUuids.size() - 1) {
                    query.append(", ");
                }
                preparedStmtList.add(userUuids.get(i));
                preparedStmtArgList.add(Types.VARCHAR);
            }
            query.append(")")
                    .append(")")
                    .append(")")
                    .append(")");
        } else {
            query.append("app.onBehalfOf @> ?::jsonb ")
                    .append("OR app.createdBy = ?)")
                    .append(")")
                    .append(")");

            preparedStmtList.add("[\"" + userUuid + "\"]");
            preparedStmtArgList.add(Types.VARCHAR);

            preparedStmtList.add(userUuid);
            preparedStmtArgList.add(Types.VARCHAR);
        }
    }
    boolean addMultipleCriteria(List<UUID> criteria, StringBuilder query, boolean firstCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(" (");
            for (int i = 0; i < criteria.size(); i++) {
                if (i > 0) query.append(" OR ");
                query.append(" app.onBehalfOf @> ?::jsonb ");
                preparedStmtList.add("[\"" + criteria.get(i).toString() + "\"]");
                preparedStmtArgList.add(Types.VARCHAR);
            }
            query.append(") ");
            firstCriteria = false;
        }
        return firstCriteria;
    }

    boolean addPartialCriteriaForApplicationCMPNumber(String criteria, StringBuilder query, boolean firstCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append("app.applicationCMPNumber").append(" LIKE ?");
            preparedStmtList.add("%" + criteria + "%"); // Add wildcard characters for partial match
            preparedStmtArgList.add(Types.VARCHAR); // Add wildcard characters for partial match
            firstCriteria = false;
        }
        return firstCriteria;
    }

    boolean addPartialCriteria(String criteria, StringBuilder query, boolean firstCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append("app.applicationNumber").append(" LIKE ?");
            preparedStmtList.add("%" + criteria + "%"); // Add wildcard characters for partial match
            preparedStmtArgList.add(Types.VARCHAR); // Add wildcard characters for partial match
            firstCriteria = false;
        }
        return firstCriteria;
    }

    boolean addCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            preparedStmtList.add(criteria);
            preparedStmtArgList.add(Types.VARCHAR); // Add wildcard characters for partial match
            firstCriteria = false;
        }
        return firstCriteria;
    }

    boolean addCriteriaExist(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList) {
        if (criteria != null && !criteria.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(str);
            preparedStmtList.add(criteria);
            firstCriteria = false;
        }
        return firstCriteria;
    }


    private void addClauseIfRequired(StringBuilder query, boolean isFirstCriteria) {
        if (isFirstCriteria) {
            query.append(" WHERE app.status <> 'DELETED' AND ");
        } else {
            query.append(" AND ");
        }
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

    public String getDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgListDoc) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_APP);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.application_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i->preparedStmtArgListDoc.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building document search query {}", e.getMessage());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Error occurred while building the query: " + e.getMessage());
        }
    }

}


