package org.pucar.dristi.repository.queryBuilder;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.web.models.CaseRequest;
import org.pucar.dristi.web.models.OrderEnum;
import org.pucar.dristi.web.models.Pagination;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CaseManagerQueryBuilderTest {

    private CaseManagerQueryBuilder caseManagerQueryBuilder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        caseManagerQueryBuilder = new CaseManagerQueryBuilder();
    }

    @Test
    void testGetCaseSummaryQuery_withCriteria() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setCaseId("123");
        caseRequest.setFilingNumber("456");
        caseRequest.setCaseNumber("789");
        caseRequest.setTenantId("tenant123");

        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = caseManagerQueryBuilder.getCaseSummaryQuery(caseRequest, preparedStmtList, preparedStmtArgList);

        // Assert
        assertTrue(query.contains("cs.id = ?"));
        assertTrue(query.contains("cs.casenumber = ?"));
        assertTrue(query.contains("cs.tenantid = ?"));
        assertEquals(4, preparedStmtList.size());
        assertEquals(4, preparedStmtArgList.size());
        assertEquals("123", preparedStmtList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
    }

    @Test
    void testGetCaseSummaryQuery_noCriteria() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest(); // No criteria set
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = caseManagerQueryBuilder.getCaseSummaryQuery(caseRequest, preparedStmtList, preparedStmtArgList);

        // Assert
        assertTrue(query.contains("FROM dristi_cases cs"));
        assertTrue(preparedStmtList.isEmpty());
        assertTrue(preparedStmtArgList.isEmpty());
    }

    @Test
    void testAddOrderByQuery_withValidPagination() {
        // Arrange
        Pagination pagination = new Pagination();
        pagination.setSortBy("createdtime");
        pagination.setOrderEnum(OrderEnum.ASC);

        String baseQuery = "SELECT * FROM dristi_cases";

        // Act
        String result = caseManagerQueryBuilder.addOrderByQuery(baseQuery, pagination);

        // Assert
        assertTrue(result.contains("ORDER BY cs.createdtime ASC"));
    }

    @Test
    void testAddOrderByQuery_withInvalidPagination() {
        // Arrange
        Pagination pagination = new Pagination(); // Invalid pagination (null sortBy)
        pagination.setOrderEnum(null);

        String baseQuery = "SELECT * FROM dristi_cases";

        // Act
        String result = caseManagerQueryBuilder.addOrderByQuery(baseQuery, pagination);

        // Assert
        assertTrue(result.contains("ORDER BY cs.createdtime DESC")); // Default order-by clause
    }

    @Test
    void testAddPaginationQuery() {
        // Arrange
        Pagination pagination = new Pagination();
        pagination.setLimit(10D);
        pagination.setOffSet(20D);

        String baseQuery = "SELECT * FROM dristi_cases";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String result = caseManagerQueryBuilder.addPaginationQuery(baseQuery, pagination, preparedStmtList, preparedStmtArgList);

        // Assert
        assertTrue(result.contains("LIMIT ? OFFSET ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(10.0, preparedStmtList.get(0));
        assertEquals(20.0, preparedStmtList.get(1));
        assertEquals(2, preparedStmtArgList.size());
        assertEquals(Types.DOUBLE, preparedStmtArgList.get(0));
        assertEquals(Types.DOUBLE, preparedStmtArgList.get(1));
    }

    @Test
    void testGetTotalCountQuery() {
        // Arrange
        String baseQuery = "SELECT * FROM dristi_cases";

        // Act
        String result = caseManagerQueryBuilder.getTotalCountQuery(baseQuery);

        // Assert
        assertEquals("SELECT COUNT(*) FROM (SELECT * FROM dristi_cases) total_result", result);
    }

    @Test
    void testAddCriteria_withCriteria() {
        // Arrange
        StringBuilder query = new StringBuilder("SELECT * FROM dristi_cases");
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String criteria = "123";

        // Act
        boolean result = caseManagerQueryBuilder.addCriteria(criteria, query, true, " cs.id = ?", preparedStmtList, preparedStmtArgList);

        // Assert
        assertEquals(1, preparedStmtList.size());
        assertEquals("123", preparedStmtList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
        assertFalse(result); // First criteria should now be false
    }

    @Test
    void testAddCriteria_noCriteria() {
        // Arrange
        StringBuilder query = new StringBuilder("SELECT * FROM dristi_cases");
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String criteria = null; // No criteria

        // Act
        boolean result = caseManagerQueryBuilder.addCriteria(criteria, query, true, " cs.id = ?", preparedStmtList, preparedStmtArgList);

        // Assert
        assertNotEquals(query.toString(),"WHERE cs.id = ?");
        assertTrue(preparedStmtList.isEmpty());
        assertTrue(preparedStmtArgList.isEmpty());
        assertTrue(result); // Criteria still remains true
    }

    @Test
    void testGetJudgementQuery() {
        // Arrange
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String filingNumber = "123";

        // Act
        String result = caseManagerQueryBuilder.getJudgementQuery(filingNumber, preparedStmtList, preparedStmtArgList);

        // Assert
        assertTrue(result.contains("dos.filingnumber = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("123", preparedStmtList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
    }

    @Test
    void testGetStatuteSectionQuery() {
        // Arrange
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String caseId = "123";

        // Act
        String result = caseManagerQueryBuilder.getStatuteSectionQuery(caseId, preparedStmtList, preparedStmtArgList);

        // Assert
        assertTrue(result.contains("ss.case_id = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("123", preparedStmtList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
    }
}

