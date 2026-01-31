package org.pucar.dristi.repository.querybuilder;

import java.sql.Types;
import java.util.List;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.CaseSearchCriteriaV2;
import org.pucar.dristi.web.models.v2.CaseSummaryListCriteria;
import org.pucar.dristi.web.models.v2.CaseSummarySearchCriteria;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class CaseQueryBuilder {
    private static final String BASE_CASE_QUERY = " SELECT cases.id as id, cases.tenantid as tenantid, cases.resolutionmechanism as resolutionmechanism, cases.casetitle as casetitle, cases.casedescription as casedescription, " +
            "cases.filingnumber as filingnumber, cases.casenumber as casenumber, cases.accesscode as accesscode, cases.advocatecount as advocatecount, cases.courtcasenumber as courtcasenumber, cases.cnrNumber as cnrNumber, " +
            " cases.outcome as outcome, cases.natureofdisposal as natureofdisposal, cases.pendingadvocaterequests as pendingadvocaterequests, cases.cmpnumber as cmpnumber, cases.courtid as courtid, cases.benchid as benchid, cases.casetype, cases.judgeid as judgeid, cases.stage as stage, cases.substage as substage, cases.filingdate as filingdate, cases.judgementdate as judgementdate, cases.registrationdate as registrationdate, cases.natureofpleading as natureofpleading, cases.status as status, cases.remarks as remarks, cases.isactive as isactive, cases.casedetails as casedetails, cases.additionaldetails as additionaldetails, cases.casecategory as casecategory, cases.createdby as createdby," +
            " cases.lastmodifiedby as lastmodifiedby, cases.createdtime as createdtime, cases.lastmodifiedtime as lastmodifiedtime, cases.stageBackup as stageBackup, cases.substageBackup as substageBackup, cases.lprNumber as lprNumber, cases.isLPRCase as isLPRCase, cases.courtCaseNumberBackup as courtCaseNumberBackup, cases.witnessDetails as witnessDetails";

    private static final String BASE_CASE_SUMMARY_LIST_QUERY = " SELECT cases.id as id, cases.tenantid as tenantid, cases.courtid as courtid, cases.casetitle as casetitle, cases.filingnumber as filingnumber, cases.casenumber as casenumber, cases.courtcasenumber as courtcasenumber, cases.cnrnumber as cnrnumber, " +
            " cases.cmpnumber as cmpnumber, cases.outcome as outcome, cases.natureofdisposal as natureofdisposal, cases.status as status, cases.pendingadvocaterequests as pendingadvocaterequests, cases.substage as substage, cases.filingdate as filingdate,cases.lastmodifiedtime as lastmodifiedtime, cases.createdtime as createdtime, cases.isLPRCase as isLPRCase, cases.lprNumber as lprNumber";

    private static final String BASE_CASE_SUMMARY_QUERY = " SELECT cases.id as id, cases.tenantid as tenantid, cases.resolutionmechanism as resolutionmechanism, cases.casetitle as casetitle, cases.casedescription as casedescription, " +
            "cases.filingnumber as filingnumber, cases.casenumber as casenumber, cases.advocatecount as advocatecount, cases.courtcasenumber as courtcasenumber, cases.cnrnumber as cnrnumber, " +
            " cases.outcome as outcome, cases.natureofdisposal as natureofdisposal, cases.cmpnumber as cmpnumber,cases.createdby as createdby,cases.courtid as courtid, cases.benchid as benchid, cases.casetype as casetype, cases.judgeid as judgeid, cases.stage as stage, cases.substage as substage, cases.filingdate as filingdate, cases.judgementdate as judgementdate, cases.registrationdate as registrationdate, cases.natureofpleading as natureofpleading, cases.status as status, cases.remarks as remarks, cases.additionaldetails as additionaldetails, cases.casecategory as casecategory, cases.createdtime as createdtime";

    private static final String FROM_CASES_TABLE = " FROM dristi_cases cases";
    private static final String ORDERBY_CLAUSE = " ORDER BY cases.{orderBy} {sortingOrder} ";
    private static final String DEFAULT_ORDERBY_CLAUSE = " ORDER BY cases.createdtime DESC ";

    private static final String DOCUMENT_SELECT_QUERY_CASE = "Select doc.id as id, doc.documenttype as documenttype, doc.filestore as filestore," +
            " doc.documentuid as documentuid, doc.additionaldetails as docadditionaldetails, doc.case_id as case_id, doc.isactive as isactive, doc.linked_case_id as linked_case_id, doc.litigant_id as litigant_id, doc.representative_id as representative_id, doc.representing_id as representing_id, doc.poaholder_id as poaholder_id ";
    private static final String FROM_DOCUMENTS_TABLE = " FROM dristi_case_document doc";

    private static final String TOTAL_COUNT_QUERY = "SELECT COUNT(*) FROM ({baseQuery}) total_result";


    private static final String BASE_LINKED_CASE_QUERY = " SELECT lics.id as id, lics.casenumbers as casenumbers, lics.case_id as case_id," +
            "lics.relationshiptype as relationshiptype," +
            " lics.isactive as isactive, lics.additionaldetails as additionaldetails, lics.createdby as createdby," +
            " lics.lastmodifiedby as lastmodifiedby, lics.createdtime as createdtime, lics.lastmodifiedtime as lastmodifiedtime ";
    private static final String FROM_LINKED_CASE_TABLE = " FROM dristi_linked_case lics";


    private static final String BASE_LITIGANT_QUERY = " SELECT ltg.id as id, ltg.tenantid as tenantid, ltg.partycategory as partycategory, ltg.case_id as case_id, ltg.isresponserequired as isresponserequired, " +
            "ltg.individualid as individualid, " +
            " ltg.organisationid as organisationid, ltg.partytype as partytype, ltg.isactive as isactive, ltg.additionaldetails as additionaldetails, ltg.createdby as createdby," +
            " ltg.lastmodifiedby as lastmodifiedby, ltg.createdtime as createdtime, ltg.lastmodifiedtime as lastmodifiedtime , ltg.hassigned as hassigned ";

    private static final String BASE_LITIGANT_SUMMARY_QUERY = " SELECT ltg.case_id as case_id, ltg.individualid as individualid, ltg.partytype as partytype";

    private static final String FROM_LITIGANT_TABLE = " FROM dristi_case_litigants ltg";


    private static final String BASE_STATUTE_SECTION_QUERY = " SELECT stse.id as id, stse.tenantid as tenantid, stse.statutes as statutes, stse.case_id as case_id, " +
            "stse.sections as sections," +
            " stse.subsections as subsections, stse.additionaldetails as additionaldetails, stse.createdby as createdby," +
            " stse.lastmodifiedby as lastmodifiedby, stse.createdtime as createdtime, stse.lastmodifiedtime as lastmodifiedtime ";
    private static final String BASE_STATUTE_SECTION_SUMMARY_QUERY = " SELECT stse.case_id as case_id, stse.sections as sections, stse.subsections as subsections";

    private static final String FROM_STATUTE_SECTION_TABLE = " FROM dristi_case_statutes_and_sections stse";


    private static final String BASE_REPRESENTATIVES_QUERY = " SELECT rep.id as id, rep.tenantid as tenantid, rep.advocateid as advocateid, rep.case_id as case_id, " +
            " rep.isactive as isactive, rep.additionaldetails as additionaldetails, rep.createdby as createdby," +
            " rep.lastmodifiedby as lastmodifiedby, rep.createdtime as createdtime, rep.lastmodifiedtime as lastmodifiedtime , rep.hassigned as hassigned, rep.advocate_filing_status as advocate_filing_status ";

    private static final String BASE_REPRESENTATIVES_SUMMARY_QUERY = " SELECT  rep.case_id as case_id, rep.id as id, rep.advocateid as advocateid, rep.additionaldetails as additionaldetails";

    private static final String FROM_REPRESENTATIVES_TABLE = " FROM dristi_case_representatives rep";

    private static final String BASE_REPRESENTING_QUERY = " SELECT rpst.id as id, rpst.tenantid as tenantid, rpst.partycategory as partycategory, rpst.representative_id as representative_id, " +
            "rpst.individualid as individualid, rpst.case_id as case_id, " +
            " rpst.organisationid as organisationid, rpst.partytype as partytype, rpst.isactive as isactive, rpst.additionaldetails as additionaldetails, rpst.createdby as createdby," +
            " rpst.lastmodifiedby as lastmodifiedby, rpst.createdtime as createdtime, rpst.lastmodifiedtime as lastmodifiedtime ";

    private static final String BASE_REPRESENTING_SUMMARY_QUERY = " SELECT rpst.representative_id as representative_id, rpst.individualid as individualid, rpst.partytype as partytype";

    private static final String FROM_REPRESENTING_TABLE = " FROM dristi_case_representing rpst";

    private static final String BASE_ADVOCATE_OFFICE_CASE_MEMBER_QUERY = " SELECT aocm.id as id, aocm.tenant_id as tenant_id, aocm.office_advocate_id as office_advocate_id, aocm.office_advocate_name as office_advocate_name, aocm.office_advocate_user_uuid as office_advocate_user_uuid, aocm.case_id as case_id, aocm.member_id as member_id, aocm.member_user_uuid as member_user_uuid, aocm.member_type as member_type, aocm.member_name as member_name, aocm.is_active as is_active, aocm.created_by as created_by, aocm.last_modified_by as last_modified_by, aocm.created_time as created_time, aocm.last_modified_time as last_modified_time ";

    private static final String FROM_ADVOCATE_OFFICE_CASE_MEMBER_TABLE = " FROM dristi_advocate_office_case_member aocm";

    private static final String BASE_POA_HOLDER_QUERY = " SELECT poaholder.id as id, poaholder.tenant_id as tenant_id, poaholder.individual_id as individual_id, poaholder.name as name, poaholder.case_id as case_id, " +
            " poaholder.is_active as is_active, poaholder.additional_details as additional_details, poaholder.created_by as created_by, poaholder.representing_litigants as representing_litigants, poaholder.poa_type as poa_type, " +
            " poaholder.last_modified_by as last_modified_by, poaholder.created_time as created_time, poaholder.last_modified_time as last_modified_time , poaholder.hasSigned as hasSigned ";

    private static final String BASE_POA_HOLDER_SUMMARY_QUERY = " SELECT poaholder.case_id as case_id, poaholder.additional_details as additional_details, poaholder.individual_id as individual_id, poaholder.representing_litigants as representing_litigants";

    private static final String FROM_POA_HOLDER_TABLE = " FROM dristi_case_poaholders poaholder";

    private static final String BASE_CASE_EXIST_QUERY = " SELECT COUNT(*) FROM dristi_cases cases ";

    public static final String AND = " AND ";

    public String getCaseSummarySearchQuery(CaseSummarySearchCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_CASE_SUMMARY_QUERY);
            query.append(FROM_CASES_TABLE);
            boolean firstCriteria = true;
            if (criteria != null) {
                firstCriteria = addCriteria(criteria.getCourtId(), query, firstCriteria, "cases.courtid = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                addCriteria(criteria.getFilingNumber() == null ? null : "%" + criteria.getFilingNumber() + "%", query, firstCriteria, "LOWER(cases.filingnumber) LIKE LOWER(?)", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                query.append(" AND cases.status NOT IN ('DRAFT_IN_PROGRESS', 'DELETED_DRAFT') ");
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building case summary search query :: {}", e.toString());
            throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the case summary search query: " + e.getMessage());
        }
    }

    public String getCasesSearchDetailsQuery(CaseSearchCriteriaV2 criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, RequestInfo requestInfo) {
        try {
            StringBuilder query = new StringBuilder(BASE_CASE_QUERY);
            query.append(FROM_CASES_TABLE);
            boolean firstCriteria = true; // To check if it's the first criteria
            if (criteria != null) {

                firstCriteria = addCriteria(criteria.getCaseId(), query, firstCriteria, "cases.id = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCourtId(), query, firstCriteria, "cases.courtid = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getFilingNumber() == null ? null : "%" + criteria.getFilingNumber() + "%", query, firstCriteria, "LOWER(cases.filingnumber) LIKE LOWER(?)", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addLitigantCriteria(criteria.getLitigantId(), criteria.getPoaHolderIndividualId(), preparedStmtList, preparedStmtArgList, requestInfo, query, firstCriteria);

                addAdvocateCriteria(criteria.getAdvocateId(), criteria.getPoaHolderIndividualId(), preparedStmtList, preparedStmtArgList, requestInfo, query, firstCriteria);
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building case details search query :: {}", e.toString());
            throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the case details search query: " + e.getMessage());
        }
    }

    public String getCasesListSearchQuery(CaseSummaryListCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, RequestInfo requestInfo) {
        try {
            StringBuilder query = new StringBuilder(BASE_CASE_SUMMARY_LIST_QUERY);
            query.append(FROM_CASES_TABLE);
            boolean firstCriteria = true; // To check if it's the first criteria
            if (criteria != null) {

                firstCriteria = addCriteria(criteria.getCaseId(), query, firstCriteria, "cases.id = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCnrNumber(), query, firstCriteria, "cases.cnrnumber = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getFilingNumber() == null ? null : "%" + criteria.getFilingNumber() + "%", query, firstCriteria, "LOWER(cases.filingnumber) LIKE LOWER(?)", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCourtCaseNumber(), query, firstCriteria, "cases.courtcasenumber = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getJudgeId(), query, firstCriteria, "cases.judgeid = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCourtId(), query, firstCriteria, "cases.courtid = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addListCriteria(criteria.getStage(), query, firstCriteria, "cases.stage", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addListCriteria(criteria.getOutcome(), query, firstCriteria, "cases.outcome", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getSubstage(), query, firstCriteria, "cases.substage = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCaseSearchTextCriteria(criteria, query, firstCriteria, preparedStmtList, preparedStmtArgList);

                firstCriteria = addLitigantCriteria(criteria.getLitigantId(), criteria.getPoaHolderIndividualId(), preparedStmtList, preparedStmtArgList, requestInfo, query, firstCriteria);

                firstCriteria = addAdvocateCriteria(criteria.getAdvocateId(), criteria.getPoaHolderIndividualId(), preparedStmtList, preparedStmtArgList, requestInfo, query, firstCriteria);

                firstCriteria = addListCriteria(criteria.getStatus(), query, firstCriteria, "cases.status", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addFilingDateCriteria(criteria, firstCriteria, query, preparedStmtList, preparedStmtArgList);

                addRegistrationDateCriteria(criteria, firstCriteria, query, preparedStmtList, preparedStmtArgList);

                // Filter by isLPRCase if specified
                if (criteria.getIsLPRCase() != null) {
                    addClauseIfRequired(query, firstCriteria);
                    query.append("cases.isLPRCase = ?");
                    preparedStmtList.add(criteria.getIsLPRCase());
                    preparedStmtArgList.add(Types.BOOLEAN);
                    firstCriteria = false;
                }
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building case summary search query :: {}", e.toString());
            throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the case summary search query: " + e.getMessage());
        }
    }

    private boolean addAdvocateCriteria(String advocateId, String poaHolderIndividualId, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, RequestInfo requestInfo, StringBuilder query, boolean firstCriteria) {
        if (advocateId != null && !advocateId.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append("((cases.id IN (" +
                    "        SELECT advocate.case_id" +
                    "        FROM dristi_case_representatives advocate" +
                    "        WHERE advocate.advocateId = ? AND advocate.isactive = true" +
                    "        UNION" +
                    "        SELECT poaholders.case_id" +
                    "        FROM dristi_case_poaholders poaholders" +
                    "        WHERE poaholders.individual_id = ? AND poaholders.is_active = true))" +
                    " OR cases.status='DRAFT_IN_PROGRESS' AND cases.createdby = ?" +
                    " OR EXISTS (SELECT 1 FROM jsonb_array_elements(pendingAdvocateRequests) elem WHERE elem->>'advocateId' = ?) ) AND (cases.status NOT IN ('DELETED_DRAFT'))");
            preparedStmtList.add(advocateId);
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtList.add(poaHolderIndividualId);
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtList.add(requestInfo.getUserInfo().getUuid());
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtList.add(advocateId);
            preparedStmtArgList.add(Types.VARCHAR);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private boolean addLitigantCriteria(String litigantId, String poaHolderIndividualId, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, RequestInfo requestInfo, StringBuilder query, boolean firstCriteria) {
        if (litigantId != null && !litigantId.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(" ((cases.id IN (" +
                    " SELECT litigant.case_id" +
                    " FROM dristi_case_litigants litigant" +
                    " WHERE litigant.individualId = ? AND litigant.isactive = true" +
                    " UNION" +
                    " SELECT poaholders.case_id" +
                    " FROM dristi_case_poaholders poaholders" +
                    " WHERE poaholders.individual_id = ? AND poaholders.is_active = true))" +
                    " OR cases.status ='DRAFT_IN_PROGRESS' AND cases.createdby = ?) AND (cases.status NOT IN ('DELETED_DRAFT'))");
            preparedStmtList.add(litigantId);
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtList.add(poaHolderIndividualId);
            preparedStmtArgList.add(Types.VARCHAR);
            preparedStmtList.add(requestInfo.getUserInfo().getUuid());
            preparedStmtArgList.add(Types.VARCHAR);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    public String checkCaseExistQuery(CaseExists caseExists, List<Object> preparedStmtList, List<Integer> preparedStmtListArgs) {
        try {
            StringBuilder query = new StringBuilder(BASE_CASE_EXIST_QUERY);
            boolean firstCriteria = true;

            if (caseExists != null) {
                firstCriteria = addCriteria(caseExists.getCaseId(), query, firstCriteria, "cases.id = ?", preparedStmtList, preparedStmtListArgs, Types.VARCHAR);

                firstCriteria = addCriteria(caseExists.getCnrNumber(), query, firstCriteria, "cases.cnrNumber = ?", preparedStmtList, preparedStmtListArgs, Types.VARCHAR);

                firstCriteria = addCriteria(caseExists.getFilingNumber(), query, firstCriteria, "cases.filingnumber = ?", preparedStmtList, preparedStmtListArgs, Types.VARCHAR);

                addCriteria(caseExists.getCourtCaseNumber(), query, firstCriteria, "cases.courtcasenumber = ?", preparedStmtList, preparedStmtListArgs, Types.VARCHAR);

                query.append(";");
            }
            return query.toString();
        } catch (Exception e) {
            log.error("Error while building case exist query", e);
            throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Error occurred while building the case exist query: " + e.getMessage());
        }
    }

    public String getCasesSearchQuery(CaseCriteria criteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, RequestInfo requestInfo) {
        try {
            StringBuilder query = new StringBuilder(BASE_CASE_QUERY);
            query.append(FROM_CASES_TABLE);
            boolean firstCriteria = true; // To check if it's the first criteria
            if (criteria != null) {

                firstCriteria = addCriteria(criteria.getCaseId(), query, firstCriteria, "cases.id = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCnrNumber(), query, firstCriteria, "cases.cnrNumber = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getFilingNumber() == null ? null : "%" + criteria.getFilingNumber() + "%", query, firstCriteria, "LOWER(cases.filingnumber) LIKE LOWER(?)", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCourtCaseNumber(), query, firstCriteria, "cases.courtcasenumber = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getJudgeId(), query, firstCriteria, "cases.judgeid = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getCourtId(), query, firstCriteria, "cases.courtId = ? ", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addListCriteria(criteria.getStage(), query, firstCriteria, "cases.stage", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addListCriteria(criteria.getOutcome(), query, firstCriteria, "cases.outcome", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCriteria(criteria.getSubstage(), query, firstCriteria, "cases.substage = ?", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addCaseSearchTextCriteria(criteria, query, firstCriteria, preparedStmtList, preparedStmtArgList);

                firstCriteria = addLitigantCriteria(criteria.getLitigantId(), criteria.getPoaHolderIndividualId(), preparedStmtList, preparedStmtArgList, requestInfo, query, firstCriteria);

                firstCriteria = addAdvocateCriteria(criteria.getAdvocateId(), criteria.getPoaHolderIndividualId(), preparedStmtList, preparedStmtArgList, requestInfo, query, firstCriteria);

                firstCriteria = addListCriteria(criteria.getStatus(), query, firstCriteria, "cases.status", preparedStmtList, preparedStmtArgList, Types.VARCHAR);

                firstCriteria = addFilingDateCriteria(criteria, firstCriteria, query, preparedStmtList, preparedStmtArgList);

                addRegistrationDateCriteria(criteria, firstCriteria, query, preparedStmtList, preparedStmtArgList);
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building case search query :: {}", e.toString());
            throw new CustomException(CASE_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the case search query: " + e.getMessage());
        }
    }

    private boolean addListCriteria(List<String> itemList, StringBuilder query, boolean firstCriteria, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, int varchar) {
        if (itemList != null && !itemList.isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            prepareStatementAndArgumentForListCriteria(itemList, query, str, preparedStmtList, preparedStmtArgList, varchar);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private static void prepareStatementAndArgumentForListCriteria(List<String> itemList, StringBuilder query, String str, List<Object> preparedStmtList, List<Integer> preparedStmtArgList, int varchar) {
        if (!itemList.isEmpty()) {
            query.append(str).append(" IN (")
                    .append(itemList.stream().map(id -> "?").collect(Collectors.joining(",")))
                    .append(")");
            preparedStmtList.addAll(itemList);
            itemList.forEach(i -> preparedStmtArgList.add(varchar));
        }
    }

    private static void addRegistrationDateCriteria(CaseCriteria criteria, boolean firstCriteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtListArgs) {
        if (criteria.getRegistrationFromDate() != null && criteria.getRegistrationToDate() != null) {
            if (!firstCriteria)
                query.append(" OR cases.registrationdate>= ? AND cases.registrationdate <= ? ").append(" ");
            else {
                query.append(" WHERE cases.registrationdate>= ? AND cases.registrationdate <= ? ").append(" ");
            }
            preparedStmtList.add(criteria.getRegistrationFromDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
            preparedStmtList.add(criteria.getRegistrationToDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
        }
    }

    private static void addRegistrationDateCriteria(CaseSummaryListCriteria criteria, boolean firstCriteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtListArgs) {
        if (criteria.getRegistrationFromDate() != null && criteria.getRegistrationToDate() != null) {
            if (!firstCriteria)
                query.append(" OR cases.registrationdate>= ? AND cases.registrationdate <= ? ").append(" ");
            else {
                query.append(" WHERE cases.registrationdate>= ? AND cases.registrationdate <= ? ").append(" ");
            }
            preparedStmtList.add(criteria.getRegistrationFromDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
            preparedStmtList.add(criteria.getRegistrationToDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
        }
    }

    private static boolean addFilingDateCriteria(CaseCriteria criteria, boolean firstCriteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtListArgs) {
        if (criteria.getFilingFromDate() != null && criteria.getFilingToDate() != null) {
            if (!firstCriteria)
                query.append(" OR cases.filingdate >= ? AND cases.filingdate <= ? ").append(" ");
            else {
                query.append(" WHERE cases.filingdate >= ? AND cases.filingdate <= ? ").append(" ");
            }
            preparedStmtList.add(criteria.getFilingFromDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
            preparedStmtList.add(criteria.getFilingToDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private static boolean addFilingDateCriteria(CaseSummaryListCriteria criteria, boolean firstCriteria, StringBuilder query, List<Object> preparedStmtList, List<Integer> preparedStmtListArgs) {
        if (criteria.getFilingFromDate() != null && criteria.getFilingToDate() != null) {
            if (!firstCriteria)
                query.append(" OR cases.filingdate >= ? AND cases.filingdate <= ? ").append(" ");
            else {
                query.append(" WHERE cases.filingdate >= ? AND cases.filingdate <= ? ").append(" ");
            }
            preparedStmtList.add(criteria.getFilingFromDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
            preparedStmtList.add(criteria.getFilingToDate());
            preparedStmtListArgs.add(Types.TIMESTAMP);
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
            query.append(AND);
        }
    }

    public String getLitigantSummarySearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_LITIGANT_SUMMARY_QUERY);
            query.append(FROM_LITIGANT_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE ltg.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("ltg.isactive = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building litigant search query :: {}", e.toString());
            throw new CustomException(LITIGANT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the litigant query: " + e.getMessage());
        }
    }

    public String getStatuteSectionSummarySearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_STATUTE_SECTION_SUMMARY_QUERY);
            query.append(FROM_STATUTE_SECTION_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE stse.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building statute section search query :: {}", e.toString());
            throw new CustomException(STATUTE_SECTION_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the statue section query: " + e.getMessage());
        }
    }

    public String getRepresentativesSummarySearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_REPRESENTATIVES_SUMMARY_QUERY);
            query.append(FROM_REPRESENTATIVES_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE rep.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("rep.isactive = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building representatives search query :: {}", e.toString());
            throw new CustomException(REPRESENTATIVES_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the representative search query: " + e.getMessage());
        }
    }

    public String getPoaHoldersSummarySearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_POA_HOLDER_SUMMARY_QUERY);
            query.append(FROM_POA_HOLDER_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE poaholder.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("poaholder.is_active = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building poa holder search query :: {}", e.toString());
            throw new CustomException(POA_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the poa holder search query: " + e.getMessage());
        }
    }

    public String getRepresentingSummarySearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_REPRESENTING_SUMMARY_QUERY);
            query.append(FROM_REPRESENTING_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE rpst.representative_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("rpst.isactive = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building representing search query :: {}", e.toString());
            throw new CustomException(REPRESENTING_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the representing search query: " + e.getMessage());
        }
    }

    public String getAdvocateOfficeCaseMemberSearchQuery(List<String> caseIds, List<String> officeAdvocateIds, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_ADVOCATE_OFFICE_CASE_MEMBER_QUERY);
            query.append(FROM_ADVOCATE_OFFICE_CASE_MEMBER_TABLE);

            boolean firstCriteria = true;
            if (caseIds != null && !caseIds.isEmpty()) {
                query.append(" WHERE aocm.case_id IN (")
                        .append(caseIds.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(caseIds);
                caseIds.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
                firstCriteria = false;
            }

            if (officeAdvocateIds != null && !officeAdvocateIds.isEmpty()) {
                query.append(firstCriteria ? " WHERE " : AND);
                query.append("aocm.office_advocate_id IN (")
                        .append(officeAdvocateIds.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(officeAdvocateIds);
                officeAdvocateIds.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
                firstCriteria = false;
            }

            query.append(firstCriteria ? " WHERE " : AND);
            query.append("aocm.is_active = true");

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building advocate office case member search query :: {}", e.toString());
            throw new CustomException("ADVOCATE_OFFICE_CASE_MEMBER_SEARCH_QUERY_EXCEPTION", "Exception occurred while building the advocate office case member search query: " + e.getMessage());
        }
    }

    public String getDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_CASE);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }
            log.info("Case Document search query :: {}", query);
            return query.toString();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while building document search query :: {}", e.toString());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the document query: " + e.getMessage());
        }
    }

    public String getLinkedCaseSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_LINKED_CASE_QUERY);
            query.append(FROM_LINKED_CASE_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE lics.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building linked case search query :: {}", e.toString());
            throw new CustomException(LINKED_CASE_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the linked case search query: " + e.getMessage());
        }
    }

    public String getLitigantSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_LITIGANT_QUERY);
            query.append(FROM_LITIGANT_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE ltg.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("ltg.isactive = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building litigant search query :: {}", e.toString());
            throw new CustomException(LITIGANT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the litigant query: " + e.getMessage());
        }
    }

    public String getStatuteSectionSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_STATUTE_SECTION_QUERY);
            query.append(FROM_STATUTE_SECTION_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE stse.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building statute section search query :: {}", e.toString());
            throw new CustomException(STATUTE_SECTION_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the statue section query: " + e.getMessage());
        }
    }

    public String getRepresentativesSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_REPRESENTATIVES_QUERY);
            query.append(FROM_REPRESENTATIVES_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE rep.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("rep.isactive = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building representatives search query :: {}", e.toString());
            throw new CustomException(REPRESENTATIVES_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the representative search query: " + e.getMessage());
        }
    }

    public String getPoaHoldersSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_POA_HOLDER_QUERY);
            query.append(FROM_POA_HOLDER_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE poaholder.case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("poaholder.is_active = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building poa holder search query :: {}", e.toString());
            throw new CustomException(POA_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the poa holder search query: " + e.getMessage());
        }
    }

    public String getRepresentingSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(BASE_REPRESENTING_QUERY);
            query.append(FROM_REPRESENTING_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE rpst.representative_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")")
                        .append(AND)
                        .append("rpst.isactive = true");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building representing search query :: {}", e.toString());
            throw new CustomException(REPRESENTING_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the representing search query: " + e.getMessage());
        }
    }

    public String getLinkedCaseDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_CASE);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.linked_case_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building linked case document search query :: {}", e.toString());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the linked case document search query: " + e.getMessage());
        }
    }

    public String getLitigantDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_CASE);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.litigant_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building litigant document search query :: {}", e.toString());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the litigant document search query: " + e.getMessage());
        }
    }

    public String getRepresentativeDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_CASE);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.representative_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building representative document search query :: {}", e.toString());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the representative document search query: " + e.getMessage());
        }
    }

    public String getPoaDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_CASE);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.poaholder_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building poa holder document search query :: {}", e.toString());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the poa holder document search query: " + e.getMessage());
        }
    }

    public String getRepresentingDocumentSearchQuery(List<String> ids, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        try {
            StringBuilder query = new StringBuilder(DOCUMENT_SELECT_QUERY_CASE);
            query.append(FROM_DOCUMENTS_TABLE);
            if (!ids.isEmpty()) {
                query.append(" WHERE doc.isactive = true AND doc.representing_id IN (")
                        .append(ids.stream().map(id -> "?").collect(Collectors.joining(",")))
                        .append(")");
                preparedStmtList.addAll(ids);
                ids.forEach(i -> preparedStmtArgList.add(Types.VARCHAR));
            }

            return query.toString();
        } catch (Exception e) {
            log.error("Error while building representing document search query :: {}", e.toString());
            throw new CustomException(DOCUMENT_SEARCH_QUERY_EXCEPTION, "Exception occurred while building the representing document search query: " + e.getMessage());
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

    private boolean addCaseSearchTextCriteria(CaseCriteria criteria, StringBuilder query, boolean firstCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria.getCaseSearchText() != null && !criteria.getCaseSearchText().isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(" (LOWER(cases.courtcasenumber) LIKE LOWER(?) OR LOWER(cases.filingnumber) LIKE LOWER(?) OR LOWER(cases.cmpnumber) LIKE LOWER(?) or LOWER(cases.casetitle) LIKE LOWER(?))");
            for (int i = 0; i < 4; i++) {
                preparedStmtList.add("%" + criteria.getCaseSearchText() + "%");
                preparedStmtArgList.add(Types.VARCHAR);
            }
            firstCriteria = false;
        }
        return firstCriteria;
    }

    private boolean addCaseSearchTextCriteria(CaseSummaryListCriteria criteria, StringBuilder query, boolean firstCriteria, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        if (criteria.getCaseSearchText() != null && !criteria.getCaseSearchText().isEmpty()) {
            addClauseIfRequired(query, firstCriteria);
            query.append(" (LOWER(cases.courtcasenumber) LIKE LOWER(?) OR LOWER(cases.filingnumber) LIKE LOWER(?) OR LOWER(cases.cmpnumber) LIKE LOWER(?) or LOWER(cases.casetitle) LIKE LOWER(?) OR LOWER(cases.lprnumber) LIKE LOWER(?)  OR LOWER(cases.courtcasenumberbackup) LIKE LOWER(?))");
            for (int i = 0; i < 6; i++) {
                preparedStmtList.add("%" + criteria.getCaseSearchText() + "%");
                preparedStmtArgList.add(Types.VARCHAR);
            }
            firstCriteria = false;
        }
        return firstCriteria;
    }

    public String getValidateAdvocateOfficeCaseMemberQuery(List<Object> preparedStmtList, List<Integer> preparedStmtArgList, 
                                                           String officeAdvocateId, String memberId) {
        String query = "SELECT COUNT(id) FROM dristi_advocate_office_case_member " +
                "WHERE office_advocate_id = ? AND member_id = ? AND is_active = true";
        
        preparedStmtList.add(officeAdvocateId);
        preparedStmtArgList.add(Types.VARCHAR);
        
        preparedStmtList.add(memberId);
        preparedStmtArgList.add(Types.VARCHAR);
        
        return query;
    }
}
