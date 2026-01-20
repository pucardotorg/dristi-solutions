package digit.repository;

import digit.repository.querybuilder.TaskManagementQueryBuilder;
import digit.repository.rowmapper.TaskManagementRowMapper;
import digit.web.models.Pagination;
import digit.web.models.TaskManagement;
import digit.web.models.TaskSearchCriteria;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementRepositoryTest {

    @Mock
    private TaskManagementQueryBuilder queryBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private TaskManagementRowMapper rowMapper;

    @InjectMocks
    private TaskManagementRepository repository;

    private TaskSearchCriteria criteria;
    private Pagination pagination;

    @BeforeEach
    void setUp() {
        criteria = TaskSearchCriteria.builder()
                .tenantId("kl")
                .filingNumber("KL-2024-001")
                .build();
        pagination = Pagination.builder()
                .limit(10.0)
                .offSet(0.0)
                .build();
    }

    @Test
    void getTaskManagement_WithPagination_ReturnsResults() {
        String query = "SELECT * FROM dristi_task_management task WHERE task.tenant_id = ?";
        List<TaskManagement> expectedList = Arrays.asList(
                TaskManagement.builder().id("task-1").build(),
                TaskManagement.builder().id("task-2").build()
        );

        when(queryBuilder.getTaskSearchQuery(eq(criteria), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), eq(pagination))).thenReturn(query + " ORDER BY created_time DESC");
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT COUNT(*) FROM (" + query + ") total_result");
        when(queryBuilder.addPaginationQuery(anyString(), eq(pagination), anyList(), anyList()))
                .thenReturn(query + " LIMIT ? OFFSET ?");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(2);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(expectedList);

        List<TaskManagement> result = repository.getTaskManagement(criteria, pagination);

        assertEquals(2, result.size());
        assertEquals(2.0, pagination.getTotalCount());
    }

    @Test
    void getTaskManagement_WithoutPagination_ReturnsResults() {
        String query = "SELECT * FROM dristi_task_management task WHERE task.tenant_id = ?";
        List<TaskManagement> expectedList = Collections.singletonList(
                TaskManagement.builder().id("task-1").build()
        );

        when(queryBuilder.getTaskSearchQuery(eq(criteria), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), isNull())).thenReturn(query + " ORDER BY created_time DESC");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(expectedList);

        List<TaskManagement> result = repository.getTaskManagement(criteria, null);

        assertEquals(1, result.size());
        verify(queryBuilder, never()).addPaginationQuery(anyString(), any(), anyList(), anyList());
    }

    @Test
    void getTaskManagement_EmptyResult_ReturnsEmptyList() {
        String query = "SELECT * FROM dristi_task_management task";

        when(queryBuilder.getTaskSearchQuery(eq(criteria), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), isNull())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        List<TaskManagement> result = repository.getTaskManagement(criteria, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void getTaskManagement_NullResult_ReturnsEmptyList() {
        String query = "SELECT * FROM dristi_task_management task";

        when(queryBuilder.getTaskSearchQuery(eq(criteria), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), isNull())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(null);

        List<TaskManagement> result = repository.getTaskManagement(criteria, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void getTaskManagement_ArgSizeMismatch_ThrowsCustomException() {
        when(queryBuilder.getTaskSearchQuery(eq(criteria), anyList(), anyList())).thenAnswer(invocation -> {
            List<Object> stmtList = invocation.getArgument(1);
            List<Integer> argList = invocation.getArgument(2);
            stmtList.add("value1");
            stmtList.add("value2");
            argList.add(1); // Only one arg type, but two values
            return "SELECT * FROM task";
        });

        CustomException exception = assertThrows(CustomException.class, 
            () -> repository.getTaskManagement(criteria, null));

        assertEquals("SEARCH_TASK_ERR", exception.getCode());
    }

    @Test
    void getTaskManagement_DatabaseException_ThrowsCustomException() {
        String query = "SELECT * FROM dristi_task_management task";

        when(queryBuilder.getTaskSearchQuery(eq(criteria), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), isNull())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenThrow(new RuntimeException("Database connection failed"));

        CustomException exception = assertThrows(CustomException.class, 
            () -> repository.getTaskManagement(criteria, null));

        assertEquals("SEARCH_TASK_ERR", exception.getCode());
    }

    @Test
    void getTotalCount_ReturnsCount() {
        String baseQuery = "SELECT * FROM task";
        String countQuery = "SELECT COUNT(*) FROM (SELECT * FROM task) total_result";
        List<Object> preparedStmtList = new ArrayList<>();
        preparedStmtList.add("kl");

        when(queryBuilder.getTotalCountQuery(baseQuery)).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), eq(Integer.class), any(Object[].class))).thenReturn(100);

        Integer result = repository.getTotalCount(baseQuery, preparedStmtList);

        assertEquals(100, result);
    }
}
