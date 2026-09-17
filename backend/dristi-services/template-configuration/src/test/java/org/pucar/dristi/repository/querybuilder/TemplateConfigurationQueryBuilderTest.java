package org.pucar.dristi.repository.querybuilder;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.OrderPagination;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.TemplateConfigurationCriteria;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TemplateConfigurationQueryBuilderTest {

    private TemplateConfigurationQueryBuilder queryBuilder;

    @BeforeEach
    void setUp() {
        queryBuilder = new TemplateConfigurationQueryBuilder();
    }

    // =====================================================
    // SEARCH QUERY TESTS
    // =====================================================

    @Test
    void testGetTemplateConfigurationSearchQuery_AllFilters() {

        TemplateConfigurationCriteria criteria = new TemplateConfigurationCriteria();
        criteria.setId("123");
        criteria.setTenantId("tenant1");
        criteria.setCourtId("court1");
        criteria.setSearchableText("order");

        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getTemplateConfigurationSearchQuery(criteria, stmtList, argList);

        assertTrue(query.contains("tc.id = ?"));
        assertTrue(query.contains("tc.tenant_id = ?"));
        assertTrue(query.contains("tc.court_id = ?"));
        assertTrue(query.contains("tc.process_title ILIKE ?"));

        assertEquals(4, stmtList.size());
        assertEquals("123", stmtList.get(0));
        assertEquals("tenant1", stmtList.get(1));
        assertEquals("court1", stmtList.get(2));
        assertEquals("%order%", stmtList.get(3));

        assertEquals(Types.VARCHAR, argList.get(0));
        assertEquals(Types.VARCHAR, argList.get(1));
        assertEquals(Types.VARCHAR, argList.get(2));
        assertEquals(Types.VARCHAR, argList.get(3));
    }

    @Test
    void testGetTemplateConfigurationSearchQuery_NoFilters() {

        TemplateConfigurationCriteria criteria = new TemplateConfigurationCriteria();
        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = queryBuilder.getTemplateConfigurationSearchQuery(criteria, stmtList, argList);

        assertTrue(query.contains("FROM dristi_template_configuration"));
        assertEquals(0, stmtList.size());
        assertEquals(0, argList.size());
    }

    @Test
    void testGetTemplateConfigurationSearchQuery_ExceptionHandling() {

        TemplateConfigurationCriteria criteria = null; // will cause NPE

        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        assertThrows(CustomException.class,
                () -> queryBuilder.getTemplateConfigurationSearchQuery(criteria, stmtList, argList));
    }

    // =====================================================
    // TOTAL COUNT TEST
    // =====================================================

    @Test
    void testGetTotalCountQuery() {

        String baseQuery = "SELECT * FROM test_table";
        String result = queryBuilder.getTotalCountQuery(baseQuery);

        assertTrue(result.contains("SELECT COUNT(*)"));
        assertTrue(result.contains(baseQuery));
    }

    // =====================================================
    // ORDER BY TESTS
    // =====================================================

    @Test
    void testAddOrderByQuery_ValidPagination() {

        Pagination pagination = new Pagination();
        pagination.setSortBy("created_time");
        pagination.setOrder(OrderPagination.ASC);

        String query = "SELECT * FROM test";

        String result = queryBuilder.addOrderByQuery(query, pagination);

        assertTrue(result.contains("ORDER BY tc.created_time ASC"));
    }

    @Test
    void testAddOrderByQuery_DefaultOrder_WhenPaginationNull() {

        String query = "SELECT * FROM test";

        String result = queryBuilder.addOrderByQuery(query, null);

        assertTrue(result.contains("ORDER BY tc.created_time DESC"));
    }

    @Test
    void testAddOrderByQuery_DefaultOrder_WhenSortByContainsSemicolon() {

        Pagination pagination = new Pagination();
        pagination.setSortBy("created_time;");
        pagination.setOrder(OrderPagination.ASC);

        String query = "SELECT * FROM test";

        String result = queryBuilder.addOrderByQuery(query, pagination);

        assertTrue(result.contains("ORDER BY tc.created_time DESC"));
    }

    // =====================================================
    // PAGINATION TEST
    // =====================================================

    @Test
    void testAddPaginationQuery() {

        Pagination pagination = new Pagination();
        pagination.setLimit(10.0);
        pagination.setOffSet(20.0);

        List<Object> stmtList = new ArrayList<>();
        List<Integer> argList = new ArrayList<>();

        String query = "SELECT * FROM test";

        String result = queryBuilder.addPaginationQuery(query, pagination, stmtList, argList);

        assertTrue(result.contains("LIMIT ? OFFSET ?"));

        assertEquals(2, stmtList.size());
        assertEquals(10.0, stmtList.get(0));
        assertEquals(20.0, stmtList.get(1));

        assertEquals(Types.DOUBLE, argList.get(0));
        assertEquals(Types.DOUBLE, argList.get(1));
    }
}
