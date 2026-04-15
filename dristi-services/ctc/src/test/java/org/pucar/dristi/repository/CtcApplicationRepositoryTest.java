package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.repository.querybuilder.CtcApplicationQueryBuilder;
import org.pucar.dristi.repository.rowmapper.CtcApplicationRowMapper;
import org.pucar.dristi.web.models.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtcApplicationRepositoryTest {

    @Mock private CtcApplicationQueryBuilder queryBuilder;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private CtcApplicationRowMapper rowMapper;
    @Spy  private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CtcApplicationRepository repository;

    private CtcApplicationSearchRequest searchRequest;

    @BeforeEach
    void setUp() {
        searchRequest = CtcApplicationSearchRequest.builder()
                .criteria(CtcApplicationSearchCriteria.builder()
                        .tenantId("pb").courtId("KLKM52").ctcApplicationNumber("CA-001").build())
                .pagination(Pagination.builder().limit(10.0).offSet(0.0).build())
                .build();
    }

    @Test
    void getCtcApplication_shouldReturnResults() {
        CtcApplication app = CtcApplication.builder().ctcApplicationNumber("CA-001").build();

        when(queryBuilder.getCtcApplicationsQuery(any(), anyList(), anyList())).thenReturn("SELECT * FROM ctc");
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn("SELECT * FROM ctc ORDER BY created_time DESC");
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT COUNT(*) FROM (SELECT * FROM ctc ORDER BY created_time DESC) total_result");
        when(queryBuilder.addPaginationQuery(anyString(), anyList(), any(), anyList())).thenReturn("SELECT * FROM ctc ORDER BY created_time DESC LIMIT 10 OFFSET 0");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), eq(Integer.class))).thenReturn(1);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(List.of(app));

        List<CtcApplication> result = repository.getCtcApplication(searchRequest);

        assertEquals(1, result.size());
        assertEquals("CA-001", result.get(0).getCtcApplicationNumber());
        assertEquals(1.0, searchRequest.getPagination().getTotalCount());
    }

    @Test
    void getCtcApplication_shouldReturnEmptyWhenNoResults() {
        when(queryBuilder.getCtcApplicationsQuery(any(), anyList(), anyList())).thenReturn("SELECT * FROM ctc");
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn("SELECT * FROM ctc ORDER BY created_time DESC");
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT COUNT(*)...");
        when(queryBuilder.addPaginationQuery(anyString(), anyList(), any(), anyList())).thenReturn("SELECT ...");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), eq(Integer.class))).thenReturn(0);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        List<CtcApplication> result = repository.getCtcApplication(searchRequest);

        assertTrue(result.isEmpty());
    }

    @Test
    void getCtcApplication_shouldReturnEmptyWhenNullResults() {
        when(queryBuilder.getCtcApplicationsQuery(any(), anyList(), anyList())).thenReturn("SELECT * FROM ctc");
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn("SELECT * FROM ctc ORDER BY created_time DESC");
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT COUNT(*)...");
        when(queryBuilder.addPaginationQuery(anyString(), anyList(), any(), anyList())).thenReturn("SELECT ...");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), eq(Integer.class))).thenReturn(0);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(null);

        List<CtcApplication> result = repository.getCtcApplication(searchRequest);

        assertTrue(result.isEmpty());
    }

    @Test
    void getCtcApplication_shouldSkipPaginationWhenNull() {
        searchRequest.setPagination(null);

        when(queryBuilder.getCtcApplicationsQuery(any(), anyList(), anyList())).thenReturn("SELECT * FROM ctc");
        when(queryBuilder.addOrderByQuery(anyString(), isNull())).thenReturn("SELECT * FROM ctc ORDER BY created_time DESC");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(List.of(CtcApplication.builder().ctcApplicationNumber("CA-001").build()));

        List<CtcApplication> result = repository.getCtcApplication(searchRequest);

        assertEquals(1, result.size());
        verify(queryBuilder, never()).addPaginationQuery(anyString(), anyList(), any(), anyList());
    }

    @Test
    void getCtcApplication_shouldThrowCustomExceptionOnError() {
        when(queryBuilder.getCtcApplicationsQuery(any(), anyList(), anyList()))
                .thenThrow(new RuntimeException("DB error"));

        assertThrows(CustomException.class, () -> repository.getCtcApplication(searchRequest));
    }

    @Test
    void getCtcApplication_shouldRethrowCustomException() {
        when(queryBuilder.getCtcApplicationsQuery(any(), anyList(), anyList()))
                .thenThrow(new CustomException("QUERY_ERR", "bad query"));

        CustomException ex = assertThrows(CustomException.class, () -> repository.getCtcApplication(searchRequest));
        assertEquals("QUERY_ERR", ex.getCode());
    }
}
