package org.pucar.dristi.repository.querybuilder;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.CaseSearchCriteria;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class CaseSummaryQueryBuilder {


    private static final String BASE_CASE_SUMMARY_QUERY = " SELECT cases.id as id, cases.tenantid as tenantid, cases.casenumber as casenumber,  cases.casetitle as casetitle,  " +
            "cases.filingnumber as filingnumber, cases.casenumber as casenumber,  cases.cnrNumber as cnrNumber, " +
            " cases.cmpnumber, cases.courtid as courtid, cases.benchid as benchid, cases.casetype, cases.judgeid as judgeid, cases.stage as stage, cases.substage as substage, cases.filingdate as filingdate, cases.registrationdate as registrationdate,  cases.status as status,  cases.isactive as isactive,  cases.casecategory as casecategory, cases.createdby as createdby," +
            " cases.lastmodifiedby as lastmodifiedby, cases.createdtime as createdtime, cases.lastmodifiedtime as lastmodifiedtime, " +
            "ltg.id as litigant_id, ltg.tenantid as litigant_tenantid, ltg.partycategory as litigant_partycategory, ltg.case_id as litigant_case_id, " +
            "ltg.individualid as litigant_individualid, ltg.organisationid as litigant_organisationid, ltg.partytype as litigant_partytype, ltg.isactive as litigant_isactive, ltg.additionaldetails as litigant_additionaldetails, ltg.createdby as litigant_createdby," +
            " ltg.lastmodifiedby as litigant_lastmodifiedby, ltg.createdtime as litigant_createdtime, ltg.lastmodifiedtime as litigant_lastmodifiedtime, " +
            "stse.id as statute_section_id, stse.tenantid as statute_section_tenantid, stse.statutes as statute_section_statutes, stse.case_id as statute_section_case_id, " +
            "stse.sections as statute_section_sections, stse.subsections as statute_section_subsections, stse.additionaldetails as statute_section_additionaldetails, stse.createdby as statute_section_createdby," +
            " stse.lastmodifiedby as statute_section_lastmodifiedby, stse.createdtime as statute_section_createdtime, stse.lastmodifiedtime as statute_section_lastmodifiedtime, " +
            "rep.id as representative_id, rep.tenantid as representative_tenantid, rep.advocateid as representative_advocateid, rep.case_id as representative_case_id, " +
            "rep.isactive as representative_isactive, rep.additionaldetails as representative_additionaldetails, rep.createdby as representative_createdby," +
            " rep.lastmodifiedby as representative_lastmodifiedby, rep.createdtime as representative_createdtime, rep.lastmodifiedtime as representative_lastmodifiedtime, " +
            "rpst.id as representing_id, rpst.tenantid as representing_tenantid, rpst.partycategory as representing_partycategory, rpst.representative_id as representing_representative_id, " +
            "rpst.individualid as representing_individualid, rpst.case_id as representing_case_id, " +
            " rpst.organisationid as representing_organisationid, rpst.partytype as representing_partytype, rpst.isactive as representing_isactive, rpst.additionaldetails as representing_additionaldetails, rpst.createdby as representing_createdby," +
            " rpst.lastmodifiedby as representing_lastmodifiedby, rpst.createdtime as representing_createdtime, rpst.lastmodifiedtime as representing_lastmodifiedtime ";


    private static final String FROM_CASES_TABLE = " FROM  dristi_cases cases";

    private static final String FROM_LITIGANT_TABLE = "  dristi_case_litigants ltg";

    private static final String FROM_STATUTE_SECTION_TABLE = "  dristi_case_statutes_and_sections stse";

    private static final String FROM_REPRESENTATIVES_TABLE = "  dristi_case_representatives rep";

    private static final String FROM_REPRESENTING_TABLE = "  dristi_case_representing rpst";

    public static final String AND = " AND ";
    public static final String OR = " OR ";
    public static final String WHERE = " WHERE ";
    public static final String LEFT_JOIN = " LEFT JOIN ";
    private static final String ORDERBY_CLAUSE = " ORDER BY cases.{orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY cases.createdtime DESC ";
    private static final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";


    private static final String LEFT_JOIN_QUERY = BASE_CASE_SUMMARY_QUERY +
            FROM_CASES_TABLE +
            LEFT_JOIN + FROM_LITIGANT_TABLE + " ON cases.id = ltg.case_id " +
            LEFT_JOIN + FROM_STATUTE_SECTION_TABLE + " ON cases.id = stse.case_id " +
            " LEFT JOIN ( " +
            FROM_REPRESENTATIVES_TABLE +
            LEFT_JOIN + FROM_REPRESENTING_TABLE + " ON rep.id = rpst.representative_id " +
            " ) ON cases.id = rep.case_id ";


    public void addClauseIfRequired(StringBuilder query, List<Object> preparedStmtList) {
        if (preparedStmtList.isEmpty()) {
            query.append(WHERE);
        } else {
            query.append(OR);
        }
    }

    public String getCaseSummarySearchQuery(@Valid CaseSearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {

        StringBuilder query = new StringBuilder(LEFT_JOIN_QUERY);

        if (!CollectionUtils.isEmpty(criteria.getCaseId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" cases.id IN ( ").append(createQuery(criteria.getCaseId())).append(" ) ");
            addToPreparedStatement(preparedStmtList, criteria.getCaseId());
            addToPreparedStatementArgs(preparedStmtArgList, Types.VARCHAR, criteria.getCaseId());
        }

        if (!CollectionUtils.isEmpty(criteria.getFilingNumber())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" cases.filingnumber IN ( ").append(createQuery(criteria.getFilingNumber())).append(" ) ");
            addToPreparedStatement(preparedStmtList, criteria.getFilingNumber());
            addToPreparedStatementArgs(preparedStmtArgList, Types.VARCHAR, criteria.getFilingNumber());
        }

        if (!CollectionUtils.isEmpty(criteria.getCnrNumber())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" cases.cnrNumber IN ( ").append(createQuery(criteria.getCnrNumber())).append(" ) ");
            addToPreparedStatement(preparedStmtList, criteria.getCnrNumber());
            addToPreparedStatementArgs(preparedStmtArgList, Types.VARCHAR, criteria.getCnrNumber());
        }

        return query.toString();

    }

    public String addOrderByQuery(String caseSummaryQuery, @Valid Pagination pagination) {

        if (isEmptyPagination(pagination) || pagination.getSortBy().contains(";")) {
            return caseSummaryQuery + DEFAULT_ORDERBY_CLAUSE;
        } else {
            caseSummaryQuery = caseSummaryQuery + ORDERBY_CLAUSE;
        }
        return caseSummaryQuery.replace("{orderBy}", pagination.getSortBy()).replace("{sortingOrder}", pagination.getOrder().name());
    }

    public String addPaginationQuery(String caseSummaryQuery, List<Object> preparedStmtList, @Valid Pagination pagination, List<Integer> preparedStmtArgList) {

        preparedStmtList.add(pagination.getLimit());
        preparedStmtArgList.add(Types.DOUBLE);

        preparedStmtList.add(pagination.getOffSet());
        preparedStmtArgList.add(Types.DOUBLE);
        return caseSummaryQuery + " LIMIT ? OFFSET ?";
    }

    private boolean isEmptyPagination(Pagination pagination) {
        return pagination == null || pagination.getSortBy() == null || pagination.getOrder() == null;
    }

    public String createQuery(List<String> ids) {
        StringBuilder builder = new StringBuilder();
        int length = ids.size();
        for (int i = 0; i < length; i++) {
            builder.append(" ?");
            if (i != length - 1)
                builder.append(",");
        }
        return builder.toString();
    }

    public void addToPreparedStatement(List<Object> preparedStmtList, List<String> ids) {
        preparedStmtList.addAll(ids);
    }

    public void addToPreparedStatementArgs(List<Integer> preparedStmtArgList, int varchar, List<String> ids) {
        ids.forEach(i -> preparedStmtArgList.add(varchar));
    }
}
