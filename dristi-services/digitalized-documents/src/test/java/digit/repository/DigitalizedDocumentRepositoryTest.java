package digit.repository;

import digit.repository.querybuilder.DigitalizedDocumentQueryBuilder;
import digit.repository.rowmapper.DigitalizedDocumentRowMapper;
import digit.web.models.*;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DigitalizedDocumentRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private DigitalizedDocumentQueryBuilder queryBuilder;

    @Mock
    private DigitalizedDocumentRowMapper rowMapper;

    @InjectMocks
    private DigitalizedDocumentRepository repository;

    private DigitalizedDocumentSearchCriteria criteria;
    private Pagination pagination;
    private DigitalizedDocument document;

    @BeforeEach
    void setUp() {
        criteria = DigitalizedDocumentSearchCriteria.builder()
                .tenantId("test-tenant")
                .documentNumber("DOC-123")
                .build();

        pagination = Pagination.builder()
                .limit(10.0)
                .offSet(0.0)
                .build();

        document = DigitalizedDocument.builder()
                .id("doc-123")
                .documentNumber("DOC-123")
                .tenantId("test-tenant")
                .build();
    }

    @Test
    void testGetDigitalizedDocuments_Success() {
        // Arrange
        String expectedQuery = "SELECT * FROM digitalized_documents";
        List<Object> preparedStatementList = new ArrayList<>();
        when(queryBuilder.getDigitalizedDocumentSearchQuery(eq(criteria), anyList(), anyList()))
                .thenReturn(expectedQuery);
        when(queryBuilder.addOrderByQuery(eq(expectedQuery), eq(pagination))).thenReturn(expectedQuery);
        // Count flow when pagination is provided
        String countQuery = "SELECT COUNT(*) FROM (..mock..) total_result";
        when(queryBuilder.getTotalCountQuery(eq(expectedQuery))).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), any(Object[].class), eq(Integer.class)))
                .thenReturn(1);
        when(queryBuilder.addPaginationQuery(eq(expectedQuery), eq(pagination), anyList(), anyList()))
                .thenReturn(expectedQuery);
        when(jdbcTemplate.query(eq(expectedQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class)))
                .thenReturn(Collections.singletonList(document));

        // Act
        List<DigitalizedDocument> result = repository.getDigitalizedDocuments(criteria, pagination);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(document, result.get(0));
        verify(queryBuilder).getDigitalizedDocumentSearchQuery(eq(criteria), anyList(), anyList());
        verify(queryBuilder).addOrderByQuery(eq(expectedQuery), eq(pagination));
        verify(queryBuilder).addPaginationQuery(eq(expectedQuery), eq(pagination), anyList(), anyList());
        verify(jdbcTemplate).query(eq(expectedQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class));
    }

    @Test
    void testGetDigitalizedDocuments_Exception() {
        // Arrange
        String expectedQuery = "SELECT * FROM digitalized_documents";
        when(queryBuilder.getDigitalizedDocumentSearchQuery(eq(criteria), anyList(), anyList()))
                .thenReturn(expectedQuery);
        when(queryBuilder.addOrderByQuery(eq(expectedQuery), eq(pagination))).thenReturn(expectedQuery);
        // Stub count path so exception comes from jdbcTemplate.query below
        String countQuery = "SELECT COUNT(*) FROM (..mock..) total_result";
        when(queryBuilder.getTotalCountQuery(eq(expectedQuery))).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), any(Object[].class), eq(Integer.class)))
                .thenReturn(1);
        when(queryBuilder.addPaginationQuery(eq(expectedQuery), eq(pagination), anyList(), anyList()))
                .thenReturn(expectedQuery);
        when(jdbcTemplate.query(eq(expectedQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class,
            () -> repository.getDigitalizedDocuments(criteria, pagination));

        assertEquals("DIGITALIZED_DOCUMENT_SEARCH_ERROR", exception.getCode());
        assertTrue(exception.getMessage().contains("Database error"));
    }
    @Test
    void testGetDigitalizedDocumentByDocumentNumber_Success() {
        // Arrange
        String documentNumber = "DOC-123";
        String tenantId = "test-tenant";
        String searchQuery = "SELECT * FROM digitalized_documents";
        when(queryBuilder.getDigitalizedDocumentSearchQuery(any(), anyList(), anyList()))
                .thenReturn(searchQuery);
        // addOrderBy + count + pagination since method uses pagination(limit=1)
        when(queryBuilder.addOrderByQuery(eq(searchQuery), any(Pagination.class))).thenReturn(searchQuery);
        String countQuery = "SELECT COUNT(*) FROM (..mock..) total_result";
        when(queryBuilder.getTotalCountQuery(eq(searchQuery))).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), any(Object[].class), eq(Integer.class))).thenReturn(1);
        when(queryBuilder.addPaginationQuery(eq(searchQuery), any(Pagination.class), anyList(), anyList())).thenReturn(searchQuery);
        when(jdbcTemplate.query(eq(searchQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class)))
                .thenReturn(Collections.singletonList(document));

        // Act
        DigitalizedDocument result = repository.getDigitalizedDocumentByDocumentNumber(documentNumber, tenantId);

        // Assert
        assertNotNull(result);
        assertEquals(document, result);
    }

    @Test
    void testGetDigitalizedDocumentByDocumentNumber_NotFound() {
        // Arrange
        String documentNumber = "NON-EXISTENT";
        String tenantId = "test-tenant";
        String searchQuery = "SELECT * FROM digitalized_documents";
        when(queryBuilder.getDigitalizedDocumentSearchQuery(any(), anyList(), anyList()))
                .thenReturn(searchQuery);
        // addOrderBy + count + pagination since method uses pagination(limit=1)
        when(queryBuilder.addOrderByQuery(eq(searchQuery), any(Pagination.class))).thenReturn(searchQuery);
        String countQuery = "SELECT COUNT(*) FROM (..mock..) total_result";
        when(queryBuilder.getTotalCountQuery(eq(searchQuery))).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), any(Object[].class), eq(Integer.class))).thenReturn(0);
        when(queryBuilder.addPaginationQuery(eq(searchQuery), any(Pagination.class), anyList(), anyList())).thenReturn(searchQuery);
        when(jdbcTemplate.query(eq(searchQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class)))
                .thenReturn(Collections.emptyList());

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class,
            () -> repository.getDigitalizedDocumentByDocumentNumber(documentNumber, tenantId));

        assertEquals("DIGITALIZED_DOCUMENT_NOT_FOUND", exception.getCode());
        assertTrue(exception.getMessage().contains("No digitalized document found for documentNumber"));
    }

    @Test
    void testGetDigitalizedDocuments_WithNullPagination() {
        // Arrange
        String baseQuery = "SELECT * FROM digitalized_documents";
        String orderedQuery = "SELECT * FROM digitalized_documents ORDER BY createdtime DESC";
        when(queryBuilder.getDigitalizedDocumentSearchQuery(eq(criteria), anyList(), anyList()))
                .thenReturn(baseQuery);
        when(queryBuilder.addOrderByQuery(eq(baseQuery), isNull()))
                .thenReturn(orderedQuery);
        when(jdbcTemplate.query(eq(orderedQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class)))
                .thenReturn(Collections.singletonList(document));

        // Act
        List<DigitalizedDocument> result = repository.getDigitalizedDocuments(criteria, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(document, result.get(0));
        verify(queryBuilder).getDigitalizedDocumentSearchQuery(eq(criteria), anyList(), anyList());
        verify(queryBuilder).addOrderByQuery(eq(baseQuery), isNull());
        verify(queryBuilder, never()).addPaginationQuery(anyString(), any(), anyList(), anyList());
        verify(jdbcTemplate).query(eq(orderedQuery), any(Object[].class), any(DigitalizedDocumentRowMapper.class));
    }
}
