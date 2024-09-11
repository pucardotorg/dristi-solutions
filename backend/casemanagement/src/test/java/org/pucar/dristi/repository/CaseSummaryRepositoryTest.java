package org.pucar.dristi.repository;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.repository.queryBuilder.CaseManagerQueryBuilder;
import org.pucar.dristi.repository.rowMapper.CaseSummaryRowMapper;
import org.pucar.dristi.repository.rowMapper.JudgementRowMapper;
import org.pucar.dristi.web.models.CaseRequest;
import org.pucar.dristi.web.models.CaseSummary;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseSummaryRepositoryTest {

    @Mock
    private CaseManagerQueryBuilder queryBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private CaseSummaryRowMapper rowMapper;

    @Mock
    private JudgementRowMapper judgementRowMapper;

    @InjectMocks
    private CaseSummaryRepository caseSummaryRepository;

    @Test
    void getCaseSummary_successWithPagination() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setFilingNumber("12345");
        caseRequest.setPagination(new Pagination());

        String query = "SELECT * FROM case_summary";
        List<CaseSummary> expectedSummaryList = new ArrayList<>();
        List<Order> orders = new ArrayList<>();
        orders.add(mock(Order.class));

        when(queryBuilder.getCaseSummaryQuery(any(CaseRequest.class), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(eq(query), any(Pagination.class))).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), any(CaseSummaryRowMapper.class)))
                .thenReturn(expectedSummaryList);
        when(queryBuilder.addPaginationQuery(eq(query), any(Pagination.class), anyList(), anyList()))
                .thenReturn(query);
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT count(*) FROM case_summary");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(100);
        // Act
        List<CaseSummary> result = caseSummaryRepository.getCaseSummary(caseRequest);

        // Assert
        assertNotNull(result);
        assertEquals(expectedSummaryList, result);
        assertEquals(100, caseRequest.getPagination().getTotalCount());
        verify(queryBuilder, times(1)).getCaseSummaryQuery(any(CaseRequest.class), anyList(), anyList());
        verify(queryBuilder, times(1)).addOrderByQuery(eq(query), any(Pagination.class));
        verify(queryBuilder, times(1)).getTotalCountQuery(eq(query));
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(int[].class), any(CaseSummaryRowMapper.class));
        verify(jdbcTemplate, times(1)).queryForObject(anyString(), eq(Integer.class), any(Object[].class));
    }

    @Test
    void getCaseSummary_noPagination() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        String query = "SELECT * FROM case_summary";
        List<CaseSummary> expectedSummaryList = new ArrayList<>();

        when(queryBuilder.getCaseSummaryQuery(any(CaseRequest.class), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(eq(query), isNull())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), any(CaseSummaryRowMapper.class)))
                .thenReturn(expectedSummaryList);

        // Act
        List<CaseSummary> result = caseSummaryRepository.getCaseSummary(caseRequest);

        // Assert
        assertNotNull(result);
        assertEquals(expectedSummaryList, result);
        verify(queryBuilder, times(1)).getCaseSummaryQuery(any(CaseRequest.class), anyList(), anyList());
        verify(queryBuilder, times(1)).addOrderByQuery(eq(query), isNull());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(int[].class), any(CaseSummaryRowMapper.class));
    }

    @Test
    void getCaseSummary_errorFetchingCaseSummary_logsError() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        String query = "SELECT * FROM case_summary";

        when(queryBuilder.getCaseSummaryQuery(any(CaseRequest.class), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(eq(query), isNull())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), any(CaseSummaryRowMapper.class)))
                .thenThrow(new RuntimeException("Error occurred while fetching case summary"));

        assertThrows(RuntimeException.class, () -> {
            // Act
            caseSummaryRepository.getCaseSummary(caseRequest);
        });
        }

    @Test
    void getTotalCountCaseSummary_success() {
        // Arrange
        String baseQuery = "SELECT * FROM case_summary";
        String countQuery = "SELECT count(*) FROM case_summary";
        List<Object> preparedStmtList = new ArrayList<>();
        when(queryBuilder.getTotalCountQuery(baseQuery)).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(100);

        // Act
        Integer result = caseSummaryRepository.getTotalCountCaseSummary(baseQuery, preparedStmtList);

        // Assert
        assertNotNull(result);
        assertEquals(100, result);
        verify(queryBuilder, times(1)).getTotalCountQuery(eq(baseQuery));
        verify(jdbcTemplate, times(1)).queryForObject(anyString(), eq(Integer.class), any(Object[].class));
    }

    @Test
    void setJudgement_throwsException_logsError() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        caseRequest.setFilingNumber("12345");

        String judgementQuery = "SELECT * FROM judgement";

        when(queryBuilder.getJudgementQuery(anyString(), anyList(), anyList())).thenReturn(judgementQuery);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), any(JudgementRowMapper.class)))
                .thenThrow(new RuntimeException("Error occurred while fetching judgement"));

        // Act & Assert
        assertThrows(CustomException.class, () -> caseSummaryRepository.getCaseSummary(caseRequest));
    }

}
