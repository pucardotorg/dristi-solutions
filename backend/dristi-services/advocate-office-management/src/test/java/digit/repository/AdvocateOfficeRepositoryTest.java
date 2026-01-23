package digit.repository;

import digit.repository.querybuilder.AdvocateOfficeQueryBuilder;
import digit.repository.rowmapper.AdvocateOfficeRowMapper;
import digit.web.models.AddMember;
import digit.web.models.MemberSearchCriteria;
import digit.web.models.Pagination;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

import static digit.config.ServiceConstants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeRepositoryTest {

    @Mock
    private AdvocateOfficeQueryBuilder queryBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private AdvocateOfficeRowMapper rowMapper;

    @InjectMocks
    private AdvocateOfficeRepository advocateOfficeRepository;

    private MemberSearchCriteria searchCriteria;
    private Pagination pagination;
    private List<AddMember> mockMembers;

    @BeforeEach
    void setUp() {
        searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(UUID.fromString("550e8400-e29b-41d4-a716-446655440000"))
                .build();

        pagination = Pagination.builder()
                .limit(10.0)
                .offSet(0.0)
                .build();

        mockMembers = Arrays.asList(
                AddMember.builder()
                        .id(UUID.randomUUID())
                        .tenantId("pg.citya")
                        .officeAdvocateId(UUID.randomUUID())
                        .memberId(UUID.randomUUID())
                        .memberType(MemberType.ADVOCATE_CLERK)
                        .memberName("John Doe")
                        .accessType(AccessType.ALL_CASES)
                        .build(),
                AddMember.builder()
                        .id(UUID.randomUUID())
                        .tenantId("pg.citya")
                        .officeAdvocateId(UUID.randomUUID())
                        .memberId(UUID.randomUUID())
                        .memberType(MemberType.ADVOCATE)
                        .memberName("Jane Smith")
                        .accessType(AccessType.SPECIFIC_CASES)
                        .build()
        );
    }

    @Test
    void testGetMembers_Success() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(mockMembers);

        List<AddMember> result = advocateOfficeRepository.getMembers(searchCriteria, null);

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(queryBuilder, times(1)).getMemberSearchQuery(any(), anyList(), anyList());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper));
    }

    @Test
    void testGetMembers_WithPagination() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn(query);
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT COUNT(*) FROM members");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(2);
        when(queryBuilder.addPaginationQuery(anyString(), any(), anyList(), anyList())).thenReturn(query + " LIMIT 10 OFFSET 0");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(mockMembers);

        List<AddMember> result = advocateOfficeRepository.getMembers(searchCriteria, pagination);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2.0, pagination.getTotalCount());
        verify(queryBuilder, times(1)).getTotalCountQuery(anyString());
        verify(queryBuilder, times(1)).addPaginationQuery(anyString(), any(), anyList(), anyList());
        verify(jdbcTemplate, times(1)).queryForObject(anyString(), eq(Integer.class), any(Object[].class));
    }

    @Test
    void testGetMembers_EmptyResult() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        List<AddMember> result = advocateOfficeRepository.getMembers(searchCriteria, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetMembers_ArgSizeMismatch() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenAnswer(invocation -> {
            List<Object> args = invocation.getArgument(1);
            List<Integer> argTypes = invocation.getArgument(2);
            args.add("value");
            return query;
        });

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeRepository.getMembers(searchCriteria, null);
        });

        assertEquals(SEARCH_MEMBER_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains(ARGS_SIZE_MISMATCH_MESSAGE));
    }

    @Test
    void testGetMembers_DatabaseException() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenThrow(new RuntimeException("Database connection error"));

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeRepository.getMembers(searchCriteria, null);
        });

        assertEquals(SEARCH_MEMBER_ERR, exception.getCode());
        assertTrue(exception.getMessage().contains("Database connection error"));
    }

    @Test
    void testGetMembers_NullResult() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn(query);
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(null);

        List<AddMember> result = advocateOfficeRepository.getMembers(searchCriteria, null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetTotalCount_Success() {
        String baseQuery = "SELECT * FROM members WHERE office_advocate_id = ?";
        String countQuery = "SELECT COUNT(*) FROM (SELECT * FROM members WHERE office_advocate_id = ?) AS temp";
        List<Object> preparedStmtList = Arrays.asList("value1", "value2");

        when(queryBuilder.getTotalCountQuery(baseQuery)).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), eq(Integer.class), any(Object[].class))).thenReturn(5);

        Integer result = advocateOfficeRepository.getTotalCount(baseQuery, preparedStmtList);

        assertEquals(5, result);
        verify(queryBuilder, times(1)).getTotalCountQuery(baseQuery);
        verify(jdbcTemplate, times(1)).queryForObject(eq(countQuery), eq(Integer.class), any(Object[].class));
    }

    @Test
    void testGetTotalCount_ZeroRecords() {
        String baseQuery = "SELECT * FROM members WHERE office_advocate_id = ?";
        String countQuery = "SELECT COUNT(*) FROM (SELECT * FROM members WHERE office_advocate_id = ?) AS temp";
        List<Object> preparedStmtList = new ArrayList<>();

        when(queryBuilder.getTotalCountQuery(baseQuery)).thenReturn(countQuery);
        when(jdbcTemplate.queryForObject(eq(countQuery), eq(Integer.class), any(Object[].class))).thenReturn(0);

        Integer result = advocateOfficeRepository.getTotalCount(baseQuery, preparedStmtList);

        assertEquals(0, result);
    }

    @Test
    void testGetMembers_WithPaginationNoTotalCount() {
        String query = "SELECT * FROM members WHERE office_advocate_id = ?";
        Pagination paginationWithoutTotal = Pagination.builder()
                .limit(5.0)
                .offSet(0.0)
                .build();

        when(queryBuilder.getMemberSearchQuery(any(), anyList(), anyList())).thenReturn(query);
        when(queryBuilder.addOrderByQuery(anyString(), any())).thenReturn(query);
        when(queryBuilder.getTotalCountQuery(anyString())).thenReturn("SELECT COUNT(*) FROM members");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(Object[].class))).thenReturn(10);
        when(queryBuilder.addPaginationQuery(anyString(), any(), anyList(), anyList()))
                .thenReturn(query + " LIMIT 5 OFFSET 0");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(mockMembers.subList(0, 1));

        List<AddMember> result = advocateOfficeRepository.getMembers(searchCriteria, paginationWithoutTotal);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(10.0, paginationWithoutTotal.getTotalCount());
    }
}
