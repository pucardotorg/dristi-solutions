package org.pucar.dristi.repository.querybuilder;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.CtcApplicationSearchCriteria;
import org.pucar.dristi.web.models.OrderPagination;
import org.pucar.dristi.web.models.Pagination;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CtcApplicationQueryBuilderTest {

    private CtcApplicationQueryBuilder queryBuilder;

    @BeforeEach
    void setUp() {
        queryBuilder = new CtcApplicationQueryBuilder();
    }

    @Test
    void getCtcApplicationsQuery_shouldReturnBaseQueryWhenNoCriteria() {
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getCtcApplicationsQuery(null, stmtList, argList);

        assertTrue(query.contains("SELECT"));
        assertTrue(query.contains("dristi_ctc_applications"));
        assertTrue(stmtList.isEmpty());
    }

    @Test
    void getCtcApplicationsQuery_shouldAddCourtIdCriteria() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .courtId("KLKM52").build();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getCtcApplicationsQuery(criteria, stmtList, argList);

        assertTrue(query.contains("WHERE"));
        assertTrue(query.contains("court_id"));
        assertEquals(1, stmtList.size());
        assertEquals("KLKM52", stmtList.get(0));
    }

    @Test
    void getCtcApplicationsQuery_shouldAddMultipleCriteria() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .courtId("KLKM52").tenantId("kl").filingNumber("FIL-001").build();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getCtcApplicationsQuery(criteria, stmtList, argList);

        assertTrue(query.contains("WHERE"));
        assertTrue(query.contains("AND"));
        assertEquals(3, stmtList.size());
    }

    @Test
    void getCtcApplicationsQuery_shouldAddSearchByCaseNumberAnTitleCriteria() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .searchByCaseNumberAnTitle("State").build();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getCtcApplicationsQuery(criteria, stmtList, argList);

        assertTrue(query.contains("LOWER(case_number) LIKE LOWER(?)"));
        assertTrue(query.contains("LOWER(case_title) LIKE LOWER(?)"));
        assertEquals(2, stmtList.size());
        assertEquals("%State%", stmtList.get(0));
    }

    @Test
    void getCtcApplicationsQuery_shouldAddSearchTextCriteria() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .searchText("john").build();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getCtcApplicationsQuery(criteria, stmtList, argList);

        assertTrue(query.contains("LOWER(ctc.case_number) LIKE LOWER(?)"));
        assertEquals(2, stmtList.size());
        assertEquals("%john%", stmtList.get(0));
    }

    @Test
    void getCtcApplicationsQuery_shouldAddCreatedByCriteria() {
        CtcApplicationSearchCriteria criteria = CtcApplicationSearchCriteria.builder()
                .createdBy("user-1").build();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getCtcApplicationsQuery(criteria, stmtList, argList);

        assertTrue(query.contains("created_by"));
        assertEquals(1, stmtList.size());
    }

    @Test
    void getTotalCountQuery_shouldWrapBaseQuery() {
        String result = queryBuilder.getTotalCountQuery("SELECT * FROM ctc");

        assertEquals("SELECT COUNT(*) FROM (SELECT * FROM ctc) total_result", result);
    }

    @Test
    void addPaginationQuery_shouldAddLimitAndOffset() {
        Pagination pagination = Pagination.builder().limit(10.0).offSet(5.0).build();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String result = queryBuilder.addPaginationQuery("SELECT * FROM ctc", stmtList, pagination, argList);

        assertTrue(result.endsWith("LIMIT ? OFFSET ?"));
        assertEquals(2, stmtList.size());
        assertEquals(10.0, stmtList.get(0));
        assertEquals(5.0, stmtList.get(1));
    }

    @Test
    void addOrderByQuery_shouldUseDefaultWhenPaginationIsNull() {
        String result = queryBuilder.addOrderByQuery("SELECT * FROM ctc", null);

        assertTrue(result.contains("ORDER BY ctc.created_time DESC"));
    }

    @Test
    void addOrderByQuery_shouldUseDefaultWhenSortByIsNull() {
        Pagination pagination = Pagination.builder().build();

        String result = queryBuilder.addOrderByQuery("SELECT * FROM ctc", pagination);

        assertTrue(result.contains("ORDER BY ctc.created_time DESC"));
    }

    @Test
    void addOrderByQuery_shouldUseCustomSort() {
        Pagination pagination = Pagination.builder()
                .sortBy("ctc.case_number").order(OrderPagination.ASC).build();

        String result = queryBuilder.addOrderByQuery("SELECT * FROM ctc", pagination);

        assertTrue(result.contains("ORDER BY ctc.case_number ASC"));
    }

    @Test
    void addOrderByQuery_shouldUseDefaultWhenSortByContainsSemicolon() {
        Pagination pagination = Pagination.builder()
                .sortBy("ctc.case_number; DROP TABLE").order(OrderPagination.ASC).build();

        String result = queryBuilder.addOrderByQuery("SELECT * FROM ctc", pagination);

        assertTrue(result.contains("ORDER BY ctc.created_time DESC"));
    }

    @Test
    void addOrderByQueryForLitigants_shouldAppendCoalesceOrder() {
        String result = queryBuilder.addOrderByQueryForLitigants("SELECT * FROM ctc");

        assertTrue(result.contains("ORDER BY COALESCE"));
    }
}
