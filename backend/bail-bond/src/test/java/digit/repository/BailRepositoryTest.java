package digit.repository;

import digit.repository.querybuilder.BailQueryBuilder;
import digit.repository.rowmapper.BailRowMapper;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BailRepositoryTest {

    @Mock
    private BailQueryBuilder queryBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private BailRowMapper rowMapper;

    @Spy
    @InjectMocks
    private BailRepository bailRepository;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }


    @Test
    void testGetBailsReturnsExpectedResults() {
        // Arrange
        BailSearchCriteria criteria = BailSearchCriteria.builder().tenantId("tenant1").build();
        Pagination pagination = Pagination.builder().limit(10).offSet(0).build();
        BailSearchRequest request = BailSearchRequest.builder()
                .criteria(criteria)
                .pagination(pagination)
                .build();

        List<String> ids = List.of("id1", "id2");
        List<Bail> expectedBails = List.of(Bail.builder().id("id1").build());

        // Mock queryBuilder calls
        when(queryBuilder.getPaginatedBailIdsQuery(any(), any(), anyList(), anyList()))
                .thenReturn("SELECT id FROM bail");

        when(queryBuilder.getBailDetailsByIdsQuery(any(), any(), anyList(), anyList()))
                .thenReturn("SELECT * FROM bail WHERE id IN (?, ?)");

        when(queryBuilder.getTotalCountQuery(any(), anyList(), anyList()))
                .thenReturn("SELECT COUNT(*) FROM bail");

        // Mock internal method call for paginated bail IDs
        doReturn(ids).when(bailRepository).getPaginatedBailIds(any());

        // Mock bail details query
        when(jdbcTemplate.query(
                anyString(),
                any(Object[].class),
                any(int[].class),
                eq(rowMapper)
        )).thenReturn(expectedBails);

        // Mock total count query
        when(jdbcTemplate.queryForObject(
                anyString(),
                any(Object[].class),
                any(int[].class),
                eq(Integer.class)
        )).thenReturn(1);

        // Act
        List<Bail> result = bailRepository.getBails(request);

        // Assert
        assertEquals(expectedBails.size(), result.size());
        assertEquals(expectedBails.get(0).getId(), result.get(0).getId());
    }

    @Test
    void testGetBails_ThrowsCustomExceptionOnMismatch() {
        // Arrange
        BailSearchRequest request = BailSearchRequest.builder()
                .criteria(BailSearchCriteria.builder().build())
                .pagination(Pagination.builder().limit(1).offSet(0).build())
                .build();

        List<String> ids = List.of("id1");

        when(queryBuilder.getPaginatedBailIdsQuery(any(), any(), any(), any()))
                .thenReturn("SELECT id FROM bail");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), any(RowMapper.class)))
                .thenReturn(List.of(Bail.builder().id("id1").build()));
        when(queryBuilder.getTotalCountQuery(any(), any(), any()))
                .thenReturn("SELECT COUNT(*) FROM bail");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(1);
        when(queryBuilder.getBailDetailsByIdsQuery(any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    List<Object> stmt = invocation.getArgument(2);
                    List<Integer> argTypes = invocation.getArgument(3);
                    stmt.add("id1");
                    // Intentionally mismatch
                    // argTypes.add(Types.VARCHAR); // skip this to cause mismatch
                    return "SELECT * FROM bail WHERE id = ?";
                });

        // Assert
        assertThrows(CustomException.class, () -> bailRepository.getBails(request));
    }

    @Test
    void testGetPaginatedBailIds_ReturnsIds() {
        BailSearchRequest request = BailSearchRequest.builder()
                .criteria(BailSearchCriteria.builder().tenantId("tenant").build())
                .pagination(Pagination.builder().limit(10).offSet(0).build())
                .build();

        when(queryBuilder.getPaginatedBailIdsQuery(any(), any(), any(), any()))
                .thenReturn("SELECT id FROM bail");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), any(RowMapper.class)))
                .thenReturn(List.of("id1", "id2"));

        List<String> ids = bailRepository.getPaginatedBailIds(request);
        assertEquals(2, ids.size());
    }

    @Test
    void testGetTotalCountBail_ReturnsCorrectCount() {
        BailSearchCriteria criteria = BailSearchCriteria.builder().tenantId("tenant").build();
        when(queryBuilder.getTotalCountQuery(any(), any(), any()))
                .thenReturn("SELECT COUNT(*) FROM bail");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(5);

        Integer count = bailRepository.getTotalCountBail(criteria);
        assertEquals(5, count);
    }
}
