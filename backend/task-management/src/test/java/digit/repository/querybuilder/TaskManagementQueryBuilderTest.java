package digit.repository.querybuilder;

import digit.web.models.Pagination;
import digit.web.models.TaskSearchCriteria;
import digit.web.models.Order;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementQueryBuilderTest {

    @InjectMocks
    private TaskManagementQueryBuilder queryBuilder;

    private List<Object> preparedStmtList;
    private List<Integer> preparedStmtArgList;

    @BeforeEach
    void setUp() {
        preparedStmtList = new ArrayList<>();
        preparedStmtArgList = new ArrayList<>();
    }

    @Test
    void getTaskSearchQuery_WithTenantId_AddsWhereClause() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder()
                .tenantId("kl")
                .build();

        String query = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE"));
        assertTrue(query.contains("task.tenant_id = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("kl", preparedStmtList.get(0));
    }

    @Test
    void getTaskSearchQuery_WithMultipleCriteria_AddsAndClause() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder()
                .tenantId("kl")
                .filingNumber("KL-2024-001")
                .status("PENDING")
                .build();

        String query = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE"));
        assertTrue(query.contains("AND"));
        assertTrue(query.contains("task.tenant_id = ?"));
        assertTrue(query.contains("task.filing_number = ?"));
        assertTrue(query.contains("task.status = ?"));
        assertEquals(3, preparedStmtList.size());
    }

    @Test
    void getTaskSearchQuery_WithTaskTypeList_AddsInClause() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder()
                .tenantId("kl")
                .taskType(Arrays.asList("TYPE_A", "TYPE_B"))
                .build();

        String query = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("task.task_type IN (?,?)"));
        assertEquals(3, preparedStmtList.size()); // tenantId + 2 task types
    }

    @Test
    void getTaskSearchQuery_NoCriteria_NoWhereClause() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder().build();

        String query = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertFalse(query.contains("WHERE"));
        assertTrue(preparedStmtList.isEmpty());
    }

    @Test
    void addOrderByQuery_WithValidPagination_AddsOrderBy() {
        String query = "SELECT * FROM task";
        Pagination pagination = Pagination.builder()
                .sortBy("created_time")
                .order(Order.DESC)
                .build();

        String result = queryBuilder.addOrderByQuery(query, pagination);

        assertTrue(result.contains("ORDER BY task.created_time DESC"));
    }

    @Test
    void addOrderByQuery_NullPagination_AddsDefaultOrderBy() {
        String query = "SELECT * FROM task";

        String result = queryBuilder.addOrderByQuery(query, null);

        assertTrue(result.contains("ORDER BY task.created_time DESC"));
    }

    @Test
    void addOrderByQuery_NullSortBy_AddsDefaultOrderBy() {
        String query = "SELECT * FROM task";
        Pagination pagination = Pagination.builder()
                .order(Order.ASC)
                .build();

        String result = queryBuilder.addOrderByQuery(query, pagination);

        assertTrue(result.contains("ORDER BY task.created_time DESC"));
    }

    @Test
    void addOrderByQuery_SqlInjectionAttempt_AddsDefaultOrderBy() {
        String query = "SELECT * FROM task";
        Pagination pagination = Pagination.builder()
                .sortBy("created_time; DROP TABLE task;")
                .order(Order.ASC)
                .build();

        String result = queryBuilder.addOrderByQuery(query, pagination);

        assertTrue(result.contains("ORDER BY task.created_time DESC"));
        assertFalse(result.contains("DROP TABLE"));
    }

    @Test
    void addPaginationQuery_AddsLimitOffset() {
        String query = "SELECT * FROM task";
        Pagination pagination = Pagination.builder()
                .limit(10.0)
                .offSet(20.0)
                .build();

        String result = queryBuilder.addPaginationQuery(query, pagination, preparedStmtList, preparedStmtArgList);

        assertTrue(result.contains("LIMIT ? OFFSET ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(10.0, preparedStmtList.get(0));
        assertEquals(20.0, preparedStmtList.get(1));
    }

    @Test
    void getTotalCountQuery_WrapsBaseQuery() {
        String baseQuery = "SELECT * FROM task WHERE tenant_id = ?";

        String result = queryBuilder.getTotalCountQuery(baseQuery);

        assertEquals("SELECT COUNT(*) FROM (SELECT * FROM task WHERE tenant_id = ?) total_result", result);
    }

    @Test
    void getTaskSearchQuery_WithAllCriteria() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder()
                .tenantId("kl")
                .taskManagementNumber("TM-001")
                .courtId("COURT-1")
                .orderNumber("ORDER-001")
                .orderItemId("ITEM-001")
                .status("PENDING")
                .taskType(Arrays.asList("TYPE_A"))
                .filingNumber("KL-2024-001")
                .partyType("COMPLAINANT")
                .id("task-id-123")
                .build();

        String query = queryBuilder.getTaskSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("task.tenant_id = ?"));
        assertTrue(query.contains("task.task_management_number = ?"));
        assertTrue(query.contains("task.court_id = ?"));
        assertTrue(query.contains("task.order_number = ?"));
        assertTrue(query.contains("task.order_item_id = ?"));
        assertTrue(query.contains("task.status = ?"));
        assertTrue(query.contains("task.task_type IN"));
        assertTrue(query.contains("task.filing_number = ?"));
        assertTrue(query.contains("task.party_type = ?"));
        assertTrue(query.contains("task.id = ?"));
        assertEquals(10, preparedStmtList.size());
    }
}
