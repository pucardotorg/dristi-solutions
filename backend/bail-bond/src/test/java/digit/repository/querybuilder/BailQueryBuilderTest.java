package digit.repository.querybuilder;

import digit.web.models.BailSearchCriteria;
import digit.web.models.Order;
import digit.web.models.Pagination;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BailQueryBuilderTest {

    private BailQueryBuilder queryBuilder;

    @BeforeEach
    void setUp() {
        queryBuilder = new BailQueryBuilder();
    }

    @Test
    void testGetPaginatedBailIdsQuery_withCriteriaAndPagination() {
        BailSearchCriteria criteria = new BailSearchCriteria();
        criteria.setTenantId("tenant1");
        criteria.setCourtId("court123");
        criteria.setStatus(Arrays.asList("ACTIVE", "PENDING"));

        Pagination pagination = new Pagination();
        pagination.setLimit(10);
        pagination.setOffSet(5);
        pagination.setSortBy("bail.created_time");
        pagination.setOrder(Order.DESC);

        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        String query = queryBuilder.getPaginatedBailIdsQuery(criteria, pagination, preparedStmtList, preparedStmtArgList);

        // Check that base tables are included
        assertTrue(query.contains("FROM dristi_bail bail"));
        assertTrue(query.contains("LEFT JOIN dristi_bail_document bail_doc"));
        assertTrue(query.contains("LEFT JOIN dristi_surety srt"));

        // Check that criteria conditions are added
        assertTrue(query.contains("bail.tenant_id = ?"));
        assertTrue(query.contains("bail.court_id = ?"));
        assertTrue(query.contains("bail.bail_status IN"));

        // Check that order by is applied
        assertTrue(query.contains("ORDER BY bail.created_time DESC"));

        // Check limit and offset placeholders
        assertTrue(query.contains("LIMIT ? OFFSET ?"));

        // Verify prepared statement values and types
        assertEquals(6, preparedStmtList.size());
        assertEquals("tenant1", preparedStmtList.get(0));
        assertEquals("court123", preparedStmtList.get(1));
        assertEquals("ACTIVE", preparedStmtList.get(2));
        assertEquals("PENDING", preparedStmtList.get(3));
        assertEquals(10, preparedStmtList.get(4)); // limit
        assertEquals(5, preparedStmtList.get(5)); // offset

        assertEquals(6, preparedStmtArgList.size());
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(1));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(2));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(3));
        assertEquals(Types.INTEGER, preparedStmtArgList.get(4));
        assertEquals(Types.INTEGER, preparedStmtArgList.get(5));
    }

    @Test
    void testGetBailDetailsByIdsQuery_withValidIds() {
        List<String> bailIds = Arrays.asList("id1", "id2", "id3");
        Pagination pagination = new Pagination();
        pagination.setSortBy("bail.created_time");
        pagination.setOrder(Order.ASC);

        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        String query = queryBuilder.getBailDetailsByIdsQuery(bailIds, pagination, preparedStmtList, preparedStmtArgList);

        // Check for IN clause with placeholders
        assertTrue(query.contains("bail.id IN (?,?,?)"));

        // Check that is_active = true is appended
        assertTrue(query.contains("bail.is_active = true"));

        // Check that order by applied correctly
        assertTrue(query.contains("ORDER BY bail.created_time ASC"));

        // Verify prepared statement list contains all bail IDs
        assertEquals(bailIds.size(), preparedStmtList.size());
        assertEquals("id1", preparedStmtList.get(0));
        assertEquals("id2", preparedStmtList.get(1));
        assertEquals("id3", preparedStmtList.get(2));

        // Verify all prepared statement arg types are VARCHAR
        for (Integer type : preparedStmtArgList) {
            assertEquals(Types.VARCHAR, type);
        }
    }

    @Test
    void testGetBailDetailsByIdsQuery_withEmptyIds_shouldThrowException() {
        List<String> emptyList = new ArrayList<>();
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            queryBuilder.getBailDetailsByIdsQuery(emptyList, null, preparedStmtList, preparedStmtArgList);
        });
        assertEquals("Bail Ids cannot be null or empty", ex.getMessage());
    }

    @Test
    void testAddOrderByQuery_withValidPagination() {
        String baseQuery = "SELECT * FROM dristi_bail bail";
        Pagination pagination = new Pagination();
        pagination.setSortBy("bail.case_number");
        pagination.setOrder(Order.ASC);

        String queryWithOrder = queryBuilder.addOrderByQuery(baseQuery, pagination);

        assertTrue(queryWithOrder.contains("ORDER BY bail.case_number ASC"));
    }

    @Test
    void testAddOrderByQuery_withInvalidPagination() {
        String baseQuery = "SELECT * FROM dristi_bail bail";

        // Null pagination
        String query1 = queryBuilder.addOrderByQuery(baseQuery, null);
        assertTrue(query1.contains("ORDER BY bail.created_time DESC"));

        // Pagination with null sortBy
        Pagination pagination = new Pagination();
        pagination.setSortBy(null);
        pagination.setOrder(Order.DESC);
        String query2 = queryBuilder.addOrderByQuery(baseQuery, pagination);
        assertTrue(query2.contains("ORDER BY bail.created_time DESC"));

        // Pagination with null order
        pagination.setSortBy("bail.created_time");
        pagination.setOrder(null);
        String query3 = queryBuilder.addOrderByQuery(baseQuery, pagination);
        assertTrue(query3.contains("ORDER BY bail.created_time DESC"));
    }

    @Test
    void testGetTotalCountQuery_withCriteria() {
        BailSearchCriteria criteria = new BailSearchCriteria();
        criteria.setTenantId("tenantA");
        criteria.setStatus(Arrays.asList("APPROVED"));

        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        String countQuery = queryBuilder.getTotalCountQuery(criteria, preparedStmtList, preparedStmtArgList);

        // Check that count query contains COUNT(*)
        assertTrue(countQuery.startsWith("SELECT COUNT(*) FROM"));

        // Check that inner query uses DISTINCT bail.id
        assertTrue(countQuery.contains("SELECT DISTINCT(bail.id)"));

        // Check that criteria are present
        assertTrue(countQuery.contains("bail.tenant_id = ?"));
        assertTrue(countQuery.contains("bail.bail_status IN"));

        // Verify prepared statement list and types
        assertEquals(2, preparedStmtList.size());
        assertEquals("tenantA", preparedStmtList.get(0));
        assertEquals("APPROVED", preparedStmtList.get(1));

        assertEquals(2, preparedStmtArgList.size());
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(0));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(1));
    }
}
