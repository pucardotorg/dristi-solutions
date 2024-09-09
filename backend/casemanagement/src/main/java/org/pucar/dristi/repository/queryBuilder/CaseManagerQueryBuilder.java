package org.pucar.dristi.repository.queryBuilder;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.CaseRequest;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class CaseManagerQueryBuilder {

    private static final String CASE_SUMMARY_QUERY = "SELECT cs.resolutionmechanism as resolutionmechanism, cs.casetitle as casetitle, cs.casedescription as casedescription , cs.filingnumber as filingnumber, cs.courtcasenumber as courtcasenumber, cs.cnrnumber as cnrnumber, cs.filingdate as filingdate, cs.registrationdate as registrationdate , cs.casedetails as casedetails, cs.casecategory as casecategory, cs.status as status, cs.remarks as remarks";

    private static final String FROM_CASE_SUMMARY_TABLE = " FROM dristi_cases cs";

    private static final String DEFAULT_ORDER_BY_CLAUSE = " ORDER BY cs.createdtime DESC ";

    private static final String ORDER_BY_CLAUSE = " ORDER BY cs.{orderBy} {sortingOrder} ";

    private  static  final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";

    private static final String JUDGEMENT_QUERY = "SELECT dos.id as id, dos.tenantid as tenantid, dos.filingnumber as filingnumber, dos.cnrnumber as cnrnumber, dos.applicationnumber as applicationnumber, dos.hearingnumber as hearingnumber, dos.ordernumber as ordernumber, dos.linkedordernumber as linkedordernumber, dos.createddate as createddate, dos.issuedby as issuedby, dos.ordertype as ordertype, dos.orderCategory as orderCategory, dos.status as status, dos.comments as comments, dos.isActive as isActive, dos.additionalDetails as additionalDetails";

    private static final String FROM_JUDGEMENT_TABLE = " FROM dristi_orders dos";

    private static final String STATUTE_SECTION_QUERY = "SELECT ss.id as id, ss.tenantid as tenantid,ss.statutes as statutes, ss.sections as sections, ss.subsections as subsections, ss.additionalDetails as additionalDetails, ss.case_id as case_id , ss.createdby as createdby, ss.createdtime as createdtime, ss.lastmodifiedby as lastmodifiedby, ss.lastmodifiedtime as lastmodifiedtime";

    private static final String FROM_STATUTE_SECTION_TABLE = " FROM dristi_case_statutes_and_sections ss";

    public String getCaseSummaryQuery(CaseRequest caseRequest, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(CASE_SUMMARY_QUERY);
            query.append(FROM_CASE_SUMMARY_TABLE);
            boolean firstCriteria = true; // To check if it's the first criteria
            firstCriteria = addCriteria(caseRequest.getCaseId(), query, firstCriteria, " cs.id = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(caseRequest.getFilingNumber(), query, firstCriteria, " cs.filingnumber = ?", preparedStmtList, preparedStmtArgList);
            firstCriteria = addCriteria(caseRequest.getCaseNumber(), query, firstCriteria, " cs.casenumber = ?", preparedStmtList, preparedStmtArgList);
            addCriteria(caseRequest.getTenantId(), query, firstCriteria, " cs.tenantid = ?", preparedStmtList, preparedStmtArgList);
            return query.toString();
        } catch (Exception e) {
            log.error("Error occurred while building case summary query {}", e.getMessage());
            throw new CustomException("CASE_SUMMARY_QUERY_EXCEPTION", "Error occurred while building the case summary query: " + e.getMessage());
        }
    }

    boolean addCriteria(String criteria, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
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
        if (isPaginationInvalid(pagination) || pagination.getSortBy().contains(";")) {
            return query + DEFAULT_ORDER_BY_CLAUSE;
        } else {
            query = query + ORDER_BY_CLAUSE;
        }
        return query.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrderEnum().name());
    }

    private static boolean isPaginationInvalid(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrderEnum() == null;
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

    public String getJudgementQuery(String filingNumber, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder query = new StringBuilder(JUDGEMENT_QUERY);
        query.append(FROM_JUDGEMENT_TABLE);
        addCriteria(filingNumber, query, true, " dos.filingnumber = ?", preparedStmtList, preparedStmtArgList);
        return query.toString();
    }

    public String getStatuteSectionQuery(String caseId, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder query = new StringBuilder(STATUTE_SECTION_QUERY);
        query.append(FROM_STATUTE_SECTION_TABLE);
        addCriteria(caseId, query, true, " ss.case_id = ?", preparedStmtList, preparedStmtArgList);
        return query.toString();
    }
}
