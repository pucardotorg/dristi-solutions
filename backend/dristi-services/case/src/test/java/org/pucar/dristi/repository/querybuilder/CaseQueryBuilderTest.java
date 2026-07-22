package org.pucar.dristi.repository.querybuilder;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CaseExists;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.enums.LifecycleStatus;
import org.pucar.dristi.web.models.v2.CaseSearchCriteriaV2;
import org.pucar.dristi.web.models.v2.CaseSummaryListCriteria;
import org.pucar.dristi.web.models.v2.CaseSummarySearchCriteria;
import org.pucar.dristi.web.models.v2.CasesFor;

import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CaseQueryBuilderTest {

    private CaseQueryBuilder caseQueryBuilder;

    private List<Object> preparedStmtList;
    private List<Integer> preparedStmtArgList;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        caseQueryBuilder = new CaseQueryBuilder();
        preparedStmtList = new ArrayList<>();
        preparedStmtArgList = new ArrayList<>();

        requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("user-uuid");
        requestInfo.setUserInfo(userInfo);
    }

    // ---------- getCaseMetaQuery ----------

    @Test
    void testGetCaseMetaQuery_withSingleFilingNumber() {
        String query = caseQueryBuilder.getCaseMetaQuery(List.of("FN1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_cases cases"));
        assertTrue(query.contains("WHERE cases.filingnumber IN (?)"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("FN1", preparedStmtList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
    }

    @Test
    void testGetCaseMetaQuery_withMultipleFilingNumbers() {
        String query = caseQueryBuilder.getCaseMetaQuery(Arrays.asList("FN1", "FN2"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE cases.filingnumber IN (?, ?)"));
        assertEquals(2, preparedStmtList.size());
        assertEquals("FN1", preparedStmtList.get(0));
        assertEquals("FN2", preparedStmtList.get(1));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(1));
    }

    // ---------- getCaseSummarySearchQuery ----------

    @Test
    void testGetCaseSummarySearchQuery_nullCriteria() {
        String query = caseQueryBuilder.getCaseSummarySearchQuery(null, preparedStmtList, preparedStmtArgList);

        assertFalse(query.contains("WHERE"));
        assertTrue(preparedStmtList.isEmpty());
    }

    @Test
    void testGetCaseSummarySearchQuery_withCourtId() {
        CaseSummarySearchCriteria criteria = CaseSummarySearchCriteria.builder().courtId("court1").build();

        String query = caseQueryBuilder.getCaseSummarySearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE cases.courtid = ?"));
        assertTrue(query.contains("cases.status NOT IN ('DRAFT_IN_PROGRESS', 'DELETED_DRAFT')"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("court1", preparedStmtList.get(0));
    }

    @Test
    void testGetCaseSummarySearchQuery_withSearchNumber() {
        CaseSummarySearchCriteria criteria = CaseSummarySearchCriteria.builder().searchNumber("  123  ").build();

        String query = caseQueryBuilder.getCaseSummarySearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("LOWER(cases.filingnumber) LIKE LOWER(?)"));
        assertTrue(query.contains("LOWER(cases.cnrnumber) LIKE LOWER(?)"));
        assertTrue(query.contains("LOWER(cases.courtcasenumber) LIKE LOWER(?)"));
        assertTrue(query.contains("LOWER(cases.cmpnumber) LIKE LOWER(?)"));
        assertEquals(4, preparedStmtList.size());
        preparedStmtList.forEach(p -> assertEquals("%123%", p));
    }

    // ---------- getCasesSearchDetailsQuery (v2) ----------

    @Test
    void testGetCasesSearchDetailsQuery_nullCriteria() {
        String query = caseQueryBuilder.getCasesSearchDetailsQuery(null, preparedStmtList, preparedStmtArgList, requestInfo);

        assertFalse(query.contains("WHERE"));
    }

    @Test
    void testGetCasesSearchDetailsQuery_withCaseId() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().caseId("case1").build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.id = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("case1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesSearchDetailsQuery_withCourtId() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().courtId("court1").build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.courtid = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("court1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesSearchDetailsQuery_withFilingNumber() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().filingNumber("FN1").build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("LOWER(cases.filingnumber) LIKE LOWER(?)"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("%FN1%", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesSearchDetailsQuery_withSecondaryStage() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().secondaryStage(List.of("STAGE1", "STAGE2")).build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("jsonb_exists_any(COALESCE(cases.secondaryStage, '[]'::jsonb), ARRAY['STAGE1','STAGE2'])"));
        assertTrue(preparedStmtList.isEmpty());
    }

    @Test
    void testGetCasesSearchDetailsQuery_withPoaHolderIndividualId() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().poaHolderIndividualId("poa1").build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("litigant.individualId = ? AND litigant.isactive = true"));
        assertTrue(query.contains("poaholders.individual_id = ? AND poaholders.is_active = true"));
        assertTrue(query.contains("cases.status = 'DRAFT_IN_PROGRESS'"));
        assertTrue(query.contains("cases.status NOT IN ('DELETED_DRAFT')"));
        assertFalse(query.contains("dcr.advocateId"));
        assertEquals(3, preparedStmtList.size());
        assertEquals("poa1", preparedStmtList.get(0));
        assertEquals("poa1", preparedStmtList.get(1));
        assertEquals("user-uuid", preparedStmtList.get(2));
    }

    @Test
    void testGetCasesSearchDetailsQuery_withAdvocateId() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().advocateId("adv1").build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("dcr.advocateId = ? AND dcr.isactive = true"));
        assertTrue(query.contains("elem->>'advocateId' = ?"));
        assertEquals(5, preparedStmtList.size());
        assertEquals("adv1", preparedStmtList.get(2));
        assertEquals("user-uuid", preparedStmtList.get(3));
        assertEquals("adv1", preparedStmtList.get(4));
    }

    @Test
    void testGetCasesSearchDetailsQuery_withOfficeAdvocateId() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().officeAdvocateId("office1").build();

        String query = caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("aocm.member_user_uuid = ?"));
        assertTrue(query.contains("aocm.office_advocate_id = ?"));
        assertEquals(5, preparedStmtList.size());
        assertEquals("user-uuid", preparedStmtList.get(2));
        assertEquals("office1", preparedStmtList.get(3));
        assertEquals("user-uuid", preparedStmtList.get(4));
    }

    @Test
    void testGetCasesSearchDetailsQuery_throwsExceptionOnNullRequestInfo() {
        CaseSearchCriteriaV2 criteria = CaseSearchCriteriaV2.builder().poaHolderIndividualId("poa1").build();

        assertThrows(CustomException.class,
                () -> caseQueryBuilder.getCasesSearchDetailsQuery(criteria, preparedStmtList, preparedStmtArgList, null));
    }

    // ---------- getCasesListSearchQuery ----------

    @Test
    void testGetCasesListSearchQuery_nullCriteria() {
        String query = caseQueryBuilder.getCasesListSearchQuery(null, preparedStmtList, preparedStmtArgList, requestInfo);

        assertFalse(query.contains("WHERE"));
    }

    @Test
    void testGetCasesListSearchQuery_withCaseId() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().caseId("case1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.id = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("case1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withCnrNumber() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().cnrNumber("CNR1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.cnrnumber = ?"));
        assertEquals("CNR1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withFilingNumber() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().filingNumber("FN1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("LOWER(cases.filingnumber) LIKE LOWER(?)"));
        assertEquals("%FN1%", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withCourtCaseNumber() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().courtCaseNumber("CCN1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.courtcasenumber = ?"));
        assertEquals("CCN1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withJudgeId() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().judgeId("judge1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.judgeid = ?"));
        assertEquals("judge1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withCourtId() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().courtId("court1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.courtid = ?"));
        assertEquals("court1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withStageList() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().stage(List.of("STAGE1", "STAGE2")).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("cases.stage IN (?,?)"));
        assertEquals(2, preparedStmtList.size());
        assertEquals("STAGE1", preparedStmtList.get(0));
        assertEquals("STAGE2", preparedStmtList.get(1));
    }

    @Test
    void testGetCasesListSearchQuery_withOutcomeList() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().outcome(List.of("OUTCOME1")).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("cases.outcome IN (?)"));
        assertEquals("OUTCOME1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withCaseSearchText() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().caseSearchText("search1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("LOWER(cases.lprnumber) LIKE LOWER(?)"));
        assertTrue(query.contains("LOWER(cases.courtcasenumberbackup) LIKE LOWER(?)"));
        assertEquals(6, preparedStmtList.size());
        preparedStmtList.forEach(p -> assertEquals("%search1%", p));
    }

    @Test
    void testGetCasesListSearchQuery_withSecondaryStage() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().secondaryStage(List.of("STAGE1")).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("jsonb_exists_any(COALESCE(cases.secondaryStage, '[]'::jsonb), ARRAY['STAGE1'])"));
        assertTrue(preparedStmtList.isEmpty());
    }

    @Test
    void testGetCasesListSearchQuery_withStatusList() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().status(List.of("ACTIVE")).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("cases.status IN (?)"));
        assertEquals("ACTIVE", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_withFilingDateRange() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().filingFromDate(100L).filingToDate(200L).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.filingdate >= ? AND cases.filingdate <= ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(100L, preparedStmtList.get(0));
        assertEquals(200L, preparedStmtList.get(1));
        assertEquals(Types.TIMESTAMP, preparedStmtArgList.get(0));
        assertEquals(Types.TIMESTAMP, preparedStmtArgList.get(1));
    }

    @Test
    void testGetCasesListSearchQuery_withRegistrationDateRange() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().registrationFromDate(300L).registrationToDate(400L).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.registrationdate>= ? AND cases.registrationdate <= ?"));
        assertEquals(300L, preparedStmtList.get(0));
        assertEquals(400L, preparedStmtList.get(1));
    }

    @Test
    void testGetCasesListSearchQuery_withLifecycleStatus() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().lifecycleStatus(LifecycleStatus.ACTIVE).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.lifecycleStatus = ?"));
        assertEquals("ACTIVE", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_casesForAdvocate() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().casesFor(CasesFor.ADVOCATE).advocateId("adv1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("dcr.advocateId = ? AND dcr.isactive = true"));
        assertTrue(query.contains("litigant.individualId = ? AND litigant.isactive = true"));
        assertTrue(query.contains("poaholders.individual_id = ? AND poaholders.is_active = true))"));
        assertEquals(4, preparedStmtList.size());
        assertEquals("adv1", preparedStmtList.get(0));
        assertEquals("adv1", preparedStmtList.get(3));
    }

    @Test
    void testGetCasesListSearchQuery_casesForAdvocate_officeAdvocateActiveMember() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder()
                .casesFor(CasesFor.ADVOCATE).officeAdvocateId("office1").isMemberActiveInCase(true).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("aocm.office_advocate_id = ?"));
        assertTrue(query.contains("aocm.member_user_uuid = ?"));
        assertTrue(query.contains("aocm.is_active = true))"));
        assertEquals(2, preparedStmtList.size());
        assertEquals("office1", preparedStmtList.get(0));
        assertEquals("user-uuid", preparedStmtList.get(1));
    }

    @Test
    void testGetCasesListSearchQuery_casesForAdvocate_officeAdvocateNotActiveMember() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder()
                .casesFor(CasesFor.ADVOCATE).officeAdvocateId("office1").isMemberActiveInCase(false).build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("EXISTS (SELECT 1 FROM dristi_advocate_office_case_member aocm"));
        assertTrue(query.contains("dcr.advocateId = ? AND dcr.isactive = true))"));
        assertEquals(3, preparedStmtList.size());
        assertEquals("office1", preparedStmtList.get(0));
        assertEquals("user-uuid", preparedStmtList.get(1));
        assertEquals("office1", preparedStmtList.get(2));
    }

    @Test
    void testGetCasesListSearchQuery_casesForPoaLitigant() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().casesFor(CasesFor.POA_LITIGANT).litigantId("lit1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("cases.status ='DRAFT_IN_PROGRESS' AND cases.createdby = ?"));
        assertEquals(3, preparedStmtList.size());
        assertEquals("lit1", preparedStmtList.get(0));
        assertEquals("user-uuid", preparedStmtList.get(2));
    }

    @Test
    void testGetCasesListSearchQuery_casesForAll_withAdvocateId() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().casesFor(CasesFor.ALL).advocateId("adv1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("dcr.advocateId = ? AND dcr.isactive = true"));
        assertEquals("adv1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_casesForAll_withoutAdvocateId() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().casesFor(CasesFor.ALL).litigantId("lit1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("cases.status ='DRAFT_IN_PROGRESS' AND cases.createdby = ?"));
        assertEquals("lit1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_noCasesFor_withMemberIdAndOfficeAdvocateId() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().memberId("member1").officeAdvocateId("office1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("aocm.office_advocate_id = ?"));
        assertEquals("office1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_noCasesFor_memberIdOnlyProducesNoClause() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().memberId("member1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertFalse(query.contains("WHERE"));
        assertTrue(preparedStmtList.isEmpty());
    }

    @Test
    void testGetCasesListSearchQuery_noCasesFor_withAdvocateIdFallback() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().advocateId("adv1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("dcr.advocateId = ? AND dcr.isactive = true"));
        assertEquals("adv1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesListSearchQuery_noCasesFor_withLitigantIdFallback() {
        CaseSummaryListCriteria criteria = CaseSummaryListCriteria.builder().litigantId("lit1").build();

        String query = caseQueryBuilder.getCasesListSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("cases.status ='DRAFT_IN_PROGRESS' AND cases.createdby = ?"));
        assertEquals("lit1", preparedStmtList.get(0));
    }

    // ---------- checkCaseExistQuery ----------

    @Test
    void testCheckCaseExistQuery_withAllFields() {
        CaseExists caseExists = CaseExists.builder().caseId("id1").cnrNumber("cnr1").filingNumber("fn1").courtCaseNumber("ccn1").build();

        String query = caseQueryBuilder.checkCaseExistQuery(caseExists, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE cases.id = ?"));
        assertTrue(query.contains("AND cases.cnrNumber = ?"));
        assertTrue(query.contains("AND cases.filingnumber = ?"));
        assertTrue(query.contains("AND cases.courtcasenumber = ?"));
        assertTrue(query.trim().endsWith(";"));
        assertEquals(4, preparedStmtList.size());
        assertEquals("id1", preparedStmtList.get(0));
        assertEquals("cnr1", preparedStmtList.get(1));
        assertEquals("fn1", preparedStmtList.get(2));
        assertEquals("ccn1", preparedStmtList.get(3));
    }

    @Test
    void testCheckCaseExistQuery_nullCaseExists() {
        String query = caseQueryBuilder.checkCaseExistQuery(null, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("SELECT COUNT(*) FROM dristi_cases cases"));
        assertFalse(query.contains(";"));
        assertTrue(preparedStmtList.isEmpty());
    }

    // ---------- getCasesSearchQuery (v1) ----------

    @Test
    void testGetCasesSearchQuery_nullCriteria() {
        String query = caseQueryBuilder.getCasesSearchQuery(null, preparedStmtList, preparedStmtArgList, requestInfo);

        assertFalse(query.contains("WHERE"));
    }

    @Test
    void testGetCasesSearchQuery_withCaseId() {
        CaseCriteria criteria = CaseCriteria.builder().caseId("case1").build();

        String query = caseQueryBuilder.getCasesSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("WHERE cases.id = ?"));
        assertEquals("case1", preparedStmtList.get(0));
    }

    @Test
    void testGetCasesSearchQuery_withIsClerkTrue() {
        CaseCriteria criteria = CaseCriteria.builder().isClerk(true).build();

        String query = caseQueryBuilder.getCasesSearchQuery(criteria, preparedStmtList, preparedStmtArgList, requestInfo);

        assertTrue(query.contains("litigant.individualId = ? AND litigant.isactive = true"));
        assertTrue(query.contains("cases.status NOT IN ('DELETED_DRAFT')"));
    }

    @Test
    void testGetCasesSearchQuery_throwsExceptionOnNullRequestInfo() {
        CaseCriteria criteria = CaseCriteria.builder().advocateId("adv1").build();

        assertThrows(CustomException.class,
                () -> caseQueryBuilder.getCasesSearchQuery(criteria, preparedStmtList, preparedStmtArgList, null));
    }

    // ---------- summary search queries ----------

    @Test
    void testGetLitigantSummarySearchQuery_withIds() {
        String query = caseQueryBuilder.getLitigantSummarySearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_case_litigants ltg"));
        assertTrue(query.contains("WHERE ltg.case_id IN (?)"));
        assertTrue(query.contains("ltg.isactive = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetLitigantSummarySearchQuery_emptyIds() {
        String query = caseQueryBuilder.getLitigantSummarySearchQuery(Collections.emptyList(), preparedStmtList, preparedStmtArgList);

        assertFalse(query.contains("WHERE"));
        assertTrue(preparedStmtList.isEmpty());
    }

    @Test
    void testGetStatuteSectionSummarySearchQuery_withIds() {
        String query = caseQueryBuilder.getStatuteSectionSummarySearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_case_statutes_and_sections stse"));
        assertTrue(query.contains("WHERE stse.case_id IN (?)"));
        assertFalse(query.contains("isactive"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentativesSummarySearchQuery_withIds() {
        String query = caseQueryBuilder.getRepresentativesSummarySearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_case_representatives rep"));
        assertTrue(query.contains("WHERE rep.case_id IN (?)"));
        assertTrue(query.contains("rep.isactive = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetPoaHoldersSummarySearchQuery_withIds() {
        String query = caseQueryBuilder.getPoaHoldersSummarySearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_case_poaholders poaholder"));
        assertTrue(query.contains("WHERE poaholder.case_id IN (?)"));
        assertTrue(query.contains("poaholder.is_active = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentingSummarySearchQuery_withIds() {
        String query = caseQueryBuilder.getRepresentingSummarySearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_case_representing rpst"));
        assertTrue(query.contains("WHERE rpst.representative_id IN (?)"));
        assertTrue(query.contains("rpst.isactive = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    // ---------- getAdvocateOfficeCaseMemberSearchQuery ----------

    @Test
    void testGetAdvocateOfficeCaseMemberSearchQuery_withCaseIdsOnly() {
        String query = caseQueryBuilder.getAdvocateOfficeCaseMemberSearchQuery(List.of("c1", "c2"), null, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE aocm.case_id IN (?,?)"));
        assertTrue(query.contains("AND aocm.is_active = true"));
        assertEquals(2, preparedStmtList.size());
    }

    @Test
    void testGetAdvocateOfficeCaseMemberSearchQuery_withOfficeAdvocateIdsOnly() {
        String query = caseQueryBuilder.getAdvocateOfficeCaseMemberSearchQuery(null, List.of("o1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE aocm.office_advocate_id IN (?)"));
        assertTrue(query.contains("AND aocm.is_active = true"));
        assertEquals("o1", preparedStmtList.get(0));
    }

    @Test
    void testGetAdvocateOfficeCaseMemberSearchQuery_withBoth() {
        String query = caseQueryBuilder.getAdvocateOfficeCaseMemberSearchQuery(List.of("c1"), List.of("o1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE aocm.case_id IN (?)"));
        assertTrue(query.contains("AND aocm.office_advocate_id IN (?)"));
        assertTrue(query.contains("AND aocm.is_active = true"));
        assertEquals("c1", preparedStmtList.get(0));
        assertEquals("o1", preparedStmtList.get(1));
    }

    @Test
    void testGetAdvocateOfficeCaseMemberSearchQuery_withNeither() {
        String query = caseQueryBuilder.getAdvocateOfficeCaseMemberSearchQuery(null, null, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE aocm.is_active = true"));
        assertTrue(preparedStmtList.isEmpty());
    }

    // ---------- document search queries ----------

    @Test
    void testGetDocumentSearchQuery_withIds() {
        String query = caseQueryBuilder.getDocumentSearchQuery(List.of("d1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_case_document doc"));
        assertTrue(query.contains("WHERE doc.isactive = true AND doc.case_id IN (?)"));
        assertEquals("d1", preparedStmtList.get(0));
    }

    @Test
    void testGetDocumentSearchQuery_emptyIds() {
        String query = caseQueryBuilder.getDocumentSearchQuery(Collections.emptyList(), preparedStmtList, preparedStmtArgList);

        assertFalse(query.contains("WHERE"));
    }

    @Test
    void testGetLinkedCaseDocumentSearchQuery_withIds() {
        String query = caseQueryBuilder.getLinkedCaseDocumentSearchQuery(List.of("d1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE doc.isactive = true AND doc.linked_case_id IN (?)"));
        assertEquals("d1", preparedStmtList.get(0));
    }

    @Test
    void testGetLitigantDocumentSearchQuery_withIds() {
        String query = caseQueryBuilder.getLitigantDocumentSearchQuery(List.of("d1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE doc.isactive = true AND doc.litigant_id IN (?)"));
        assertEquals("d1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentativeDocumentSearchQuery_withIds() {
        String query = caseQueryBuilder.getRepresentativeDocumentSearchQuery(List.of("d1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE doc.isactive = true AND doc.representative_id IN (?)"));
        assertEquals("d1", preparedStmtList.get(0));
    }

    @Test
    void testGetPoaDocumentSearchQuery_withIds() {
        String query = caseQueryBuilder.getPoaDocumentSearchQuery(List.of("d1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE doc.isactive = true AND doc.poaholder_id IN (?)"));
        assertEquals("d1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentingDocumentSearchQuery_withIds() {
        String query = caseQueryBuilder.getRepresentingDocumentSearchQuery(List.of("d1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE doc.isactive = true AND doc.representing_id IN (?)"));
        assertEquals("d1", preparedStmtList.get(0));
    }

    // ---------- entity search queries (full projection) ----------

    @Test
    void testGetLinkedCaseSearchQuery_withIds() {
        String query = caseQueryBuilder.getLinkedCaseSearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("FROM dristi_linked_case lics"));
        assertTrue(query.contains("WHERE lics.case_id IN (?)"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetLitigantSearchQuery_withIds() {
        String query = caseQueryBuilder.getLitigantSearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE ltg.case_id IN (?)"));
        assertTrue(query.contains("ltg.isactive = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetStatuteSectionSearchQuery_withIds() {
        String query = caseQueryBuilder.getStatuteSectionSearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE stse.case_id IN (?)"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentativesSearchQuery_withIds() {
        String query = caseQueryBuilder.getRepresentativesSearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE rep.case_id IN (?)"));
        assertTrue(query.contains("rep.isactive = true"));
        assertFalse(query.contains("dristi_advocate da"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentativesSearchQueryWithAdvocateJoin_withIds() {
        String query = caseQueryBuilder.getRepresentativesSearchQueryWithAdvocateJoin(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("LEFT JOIN dristi_advocate da ON rep.advocateid = da.id"));
        assertTrue(query.contains("da.barregistrationnumber as advocate_barregistrationnumber"));
        assertTrue(query.contains("WHERE rep.case_id IN (?)"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetPoaHoldersSearchQuery_withIds() {
        String query = caseQueryBuilder.getPoaHoldersSearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE poaholder.case_id IN (?)"));
        assertTrue(query.contains("poaholder.is_active = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    @Test
    void testGetRepresentingSearchQuery_withIds() {
        String query = caseQueryBuilder.getRepresentingSearchQuery(List.of("id1"), preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE rpst.representative_id IN (?)"));
        assertTrue(query.contains("rpst.isactive = true"));
        assertEquals("id1", preparedStmtList.get(0));
    }

    // ---------- misc query utilities ----------

    @Test
    void testGetTotalCountQuery() {
        String result = caseQueryBuilder.getTotalCountQuery("SELECT * FROM cases");

        assertEquals("SELECT COUNT(*) FROM (SELECT * FROM cases) total_result", result);
    }

    @Test
    void testAddPaginationQuery() {
        Pagination pagination = Pagination.builder().limit(10).offSet(0).build();

        String result = caseQueryBuilder.addPaginationQuery("SELECT * FROM cases", preparedStmtList, pagination, preparedStmtArgList);

        assertTrue(result.contains("LIMIT ? OFFSET ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(10, preparedStmtList.get(0));
        assertEquals(0, preparedStmtList.get(1));
        assertEquals(Types.INTEGER, preparedStmtArgList.get(0));
        assertEquals(Types.INTEGER, preparedStmtArgList.get(1));
    }

    @Test
    void testAddOrderByQuery_withValidPagination() {
        Pagination pagination = Pagination.builder().sortBy("casenumber").order(Order.ASC).build();

        String result = caseQueryBuilder.addOrderByQuery("SELECT * FROM cases", pagination);

        assertTrue(result.contains("ORDER BY cases.casenumber ASC"));
    }

    @Test
    void testAddOrderByQuery_withEmptyPagination() {
        Pagination pagination = Pagination.builder().sortBy(null).build();

        String result = caseQueryBuilder.addOrderByQuery("SELECT * FROM cases", pagination);

        assertTrue(result.contains("ORDER BY cases.createdtime DESC"));
    }

    @Test
    void testAddOrderByQuery_withNullPagination() {
        String result = caseQueryBuilder.addOrderByQuery("SELECT * FROM cases", null);

        assertTrue(result.contains("ORDER BY cases.createdtime DESC"));
    }

    @Test
    void testAddOrderByQuery_rejectsSortByContainingSemicolon() {
        Pagination pagination = Pagination.builder().sortBy("casenumber; DROP TABLE cases;").order(Order.ASC).build();

        String result = caseQueryBuilder.addOrderByQuery("SELECT * FROM cases", pagination);

        assertTrue(result.contains("ORDER BY cases.createdtime DESC"));
        assertFalse(result.contains("DROP TABLE"));
    }

    @Test
    void testAddOrderByQueryForLitigants() {
        String result = caseQueryBuilder.addOrderByQueryForLitigants("SELECT * FROM dristi_case_litigants ltg");

        assertEquals("SELECT * FROM dristi_case_litigants ltg ORDER BY COALESCE((ltg.additionaldetails->>'currentPosition')::int, 999999);", result);
    }

    @Test
    void testGetValidateAdvocateOfficeCaseMemberQuery() {
        String query = caseQueryBuilder.getValidateAdvocateOfficeCaseMemberQuery(preparedStmtList, preparedStmtArgList, "office1", "member1");

        assertEquals("SELECT COUNT(*) FROM dristi_advocate_office_case_member WHERE office_advocate_id = ? AND member_id = ? AND is_active = true", query);
        assertEquals(2, preparedStmtList.size());
        assertEquals("office1", preparedStmtList.get(0));
        assertEquals("member1", preparedStmtList.get(1));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(1));
    }

    @Test
    void testGetOfficeAdvocateIdsByMemberIdAndCaseIdQuery() {
        String query = caseQueryBuilder.getOfficeAdvocateIdsByMemberIdAndCaseIdQuery(preparedStmtList, preparedStmtArgList, "member1", "case1");

        assertEquals("SELECT DISTINCT office_advocate_id FROM dristi_advocate_office_case_member WHERE member_id = ? AND case_id = ? AND is_active = true", query);
        assertEquals("member1", preparedStmtList.get(0));
        assertEquals("case1", preparedStmtList.get(1));
    }

    @Test
    void testGetCaseIdFromFilingNumberQuery() {
        String query = caseQueryBuilder.getCaseIdFromFilingNumberQuery(preparedStmtList, preparedStmtArgList, "FN1");

        assertEquals("SELECT id FROM dristi_cases WHERE filingnumber = ?", query);
        assertEquals(1, preparedStmtList.size());
        assertEquals("FN1", preparedStmtList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
    }
}