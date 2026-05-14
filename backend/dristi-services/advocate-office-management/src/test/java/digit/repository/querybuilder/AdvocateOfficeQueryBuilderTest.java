package digit.repository.querybuilder;

import digit.web.models.MemberSearchCriteria;
import digit.web.models.Pagination;
import digit.web.models.enums.MemberType;
import digit.web.models.enums.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeQueryBuilderTest {

    @InjectMocks
    private AdvocateOfficeQueryBuilder queryBuilder;

    private MemberSearchCriteria criteria;
    private List<Object> preparedStmtList;
    private List<Integer> preparedStmtArgList;

    @BeforeEach
    void setUp() {
        criteria = new MemberSearchCriteria();
        preparedStmtList = new ArrayList<>();
        preparedStmtArgList = new ArrayList<>();
    }

    @Test
    void testGetMemberSearchQuery_OnlyActiveMembersByDefault() {
        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertNotNull(query);
        assertTrue(query.contains("SELECT"));
        assertTrue(query.contains("FROM dristi_advocate_office_member member"));
        assertTrue(query.contains("WHERE member.is_active = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals(Boolean.TRUE, preparedStmtList.get(0));
        assertEquals(Types.BOOLEAN, preparedStmtArgList.get(0));
    }

    @Test
    void testGetMemberSearchQuery_WithOfficeAdvocateId() {
        UUID officeAdvocateId = UUID.randomUUID();
        criteria.setOfficeAdvocateId(officeAdvocateId);

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("WHERE member.is_active = ?"));
        assertTrue(query.contains("AND member.office_advocate_id = ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(Boolean.TRUE, preparedStmtList.get(0));
        assertEquals(officeAdvocateId.toString(), preparedStmtList.get(1));
    }

    @Test
    void testGetMemberSearchQuery_WithMemberType() {
        criteria.setMemberType(MemberType.ADVOCATE_CLERK);

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.member_type = ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals("ADVOCATE_CLERK", preparedStmtList.get(1));
    }

    @Test
    void testGetMemberSearchQuery_WithMemberId() {
        UUID memberId = UUID.randomUUID();
        criteria.setMemberId(memberId);

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.member_id = ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(memberId.toString(), preparedStmtList.get(1));
    }

    @Test
    void testGetMemberSearchQuery_WithMemberName() {
        criteria.setMemberName("John");

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.member_name ILIKE ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals("%John%", preparedStmtList.get(1));
        assertEquals(Types.VARCHAR, preparedStmtArgList.get(1));
    }

    @Test
    void testGetMemberSearchQuery_WithMemberMobileNumber() {
        criteria.setMemberMobileNumber("9876543210");

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.member_mobile_number = ?"));
        assertEquals(2, preparedStmtList.size());
        assertEquals("9876543210", preparedStmtList.get(1));
    }

    @Test
    void testGetMemberSearchQuery_WithIsActiveFalse() {
        criteria.setIsActive(false);

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.is_active = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals(Boolean.FALSE, preparedStmtList.get(0));
    }

    @Test
    void testGetMemberSearchQuery_WithAllCriteria() {
        UUID officeAdvocateId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        criteria.setIsActive(true);
        criteria.setOfficeAdvocateId(officeAdvocateId);
        criteria.setMemberType(MemberType.ADVOCATE);
        criteria.setMemberId(memberId);
        criteria.setMemberName("Jane");
        criteria.setMemberMobileNumber("1234567890");

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.is_active = ?"));
        assertTrue(query.contains("member.office_advocate_id = ?"));
        assertTrue(query.contains("member.member_type = ?"));
        assertTrue(query.contains("member.member_id = ?"));
        assertTrue(query.contains("member.member_name ILIKE ?"));
        assertTrue(query.contains("member.member_mobile_number = ?"));
        assertEquals(6, preparedStmtList.size());
    }

    @Test
    void testGetMemberSearchQuery_EmptyMemberName() {
        criteria.setMemberName("");

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertFalse(query.contains("member.member_name ILIKE ?"));
        assertEquals(1, preparedStmtList.size());
    }

    @Test
    void testGetMemberSearchQuery_EmptyMobileNumber() {
        criteria.setMemberMobileNumber("");

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertFalse(query.contains("member.member_mobile_number = ?"));
        assertEquals(1, preparedStmtList.size());
    }

    @Test
    void testAddPaginationQuery() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .limit(10.0)
                .offSet(5.0)
                .build();

        String query = queryBuilder.addPaginationQuery(baseQuery, pagination, preparedStmtList, preparedStmtArgList);

        assertEquals("SELECT * FROM member LIMIT ? OFFSET ?", query);
        assertEquals(2, preparedStmtList.size());
        assertEquals(10.0, preparedStmtList.get(0));
        assertEquals(5.0, preparedStmtList.get(1));
        assertEquals(Types.DOUBLE, preparedStmtArgList.get(0));
        assertEquals(Types.DOUBLE, preparedStmtArgList.get(1));
    }

    @Test
    void testAddOrderByQuery_WithValidPagination() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .sortBy("created_time")
                .order(Order.DESC)
                .build();

        String query = queryBuilder.addOrderByQuery(baseQuery, pagination);

        assertTrue(query.contains("ORDER BY member.created_time DESC"));
    }

    @Test
    void testAddOrderByQuery_WithAscendingOrder() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .sortBy("member_name")
                .order(Order.ASC)
                .build();

        String query = queryBuilder.addOrderByQuery(baseQuery, pagination);

        assertTrue(query.contains("ORDER BY member.member_name ASC"));
    }

    @Test
    void testAddOrderByQuery_WithNullPagination() {
        String baseQuery = "SELECT * FROM member";

        String query = queryBuilder.addOrderByQuery(baseQuery, null);

        assertTrue(query.contains("ORDER BY member.created_time DESC"));
    }

    @Test
    void testAddOrderByQuery_WithNullSortBy() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .order(Order.DESC)
                .build();

        String query = queryBuilder.addOrderByQuery(baseQuery, pagination);

        assertTrue(query.contains("ORDER BY member.created_time DESC"));
    }

    @Test
    void testAddOrderByQuery_WithNullOrder() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .sortBy("member_name")
                .build();

        String query = queryBuilder.addOrderByQuery(baseQuery, pagination);

        assertTrue(query.contains("ORDER BY member.created_time DESC"));
    }

    @Test
    void testAddOrderByQuery_WithSemicolonInSortBy() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .sortBy("member_name; DROP TABLE member")
                .order(Order.DESC)
                .build();

        String query = queryBuilder.addOrderByQuery(baseQuery, pagination);

        assertTrue(query.contains("ORDER BY member.created_time DESC"));
        assertFalse(query.contains("DROP TABLE"));
    }

    @Test
    void testGetTotalCountQuery() {
        String baseQuery = "SELECT * FROM member WHERE is_active = true";

        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);

        assertEquals("SELECT COUNT(*) FROM (SELECT * FROM member WHERE is_active = true) total_result", countQuery);
    }

    @Test
    void testGetMemberSearchQuery_VerifySelectColumns() {
        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertTrue(query.contains("member.id as id"));
        assertTrue(query.contains("member.office_advocate_id as office_advocate_id"));
        assertTrue(query.contains("member.member_type as member_type"));
        assertTrue(query.contains("member.member_id as member_id"));
        assertTrue(query.contains("member.member_name as member_name"));
        assertTrue(query.contains("member.member_mobile_number as member_mobile_number"));
        assertTrue(query.contains("member.access_type as access_type"));
        assertTrue(query.contains("member.allow_case_create as allow_case_create"));
        assertTrue(query.contains("member.add_new_cases_automatically as add_new_cases_automatically"));
        assertTrue(query.contains("member.is_active as is_active"));
        assertTrue(query.contains("member.created_by as created_by"));
        assertTrue(query.contains("member.last_modified_by as last_modified_by"));
        assertTrue(query.contains("member.created_time as created_time"));
        assertTrue(query.contains("member.last_modified_time as last_modified_time"));
    }

    @Test
    void testGetMemberSearchQuery_MultipleCriteriaAndOrder() {
        UUID officeAdvocateId = UUID.randomUUID();
        criteria.setOfficeAdvocateId(officeAdvocateId);
        criteria.setMemberType(MemberType.ADVOCATE_CLERK);

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        int whereIndex = query.indexOf("WHERE");
        int firstAndIndex = query.indexOf("AND", whereIndex);
        int secondAndIndex = query.indexOf("AND", firstAndIndex + 1);

        assertTrue(whereIndex > 0);
        assertTrue(firstAndIndex > whereIndex);
        assertTrue(secondAndIndex > firstAndIndex);
    }

    @Test
    void testAddPaginationQuery_WithZeroOffset() {
        String baseQuery = "SELECT * FROM member";
        Pagination pagination = Pagination.builder()
                .limit(20.0)
                .offSet(0.0)
                .build();

        queryBuilder.addPaginationQuery(baseQuery, pagination, preparedStmtList, preparedStmtArgList);

        assertEquals(2, preparedStmtList.size());
        assertEquals(0.0, preparedStmtList.get(1));
    }

    @Test
    void testGetMemberSearchQuery_WithNullValues() {
        criteria.setOfficeAdvocateId(null);
        criteria.setMemberType(null);
        criteria.setMemberId(null);
        criteria.setMemberName(null);
        criteria.setMemberMobileNumber(null);

        String query = queryBuilder.getMemberSearchQuery(criteria, preparedStmtList, preparedStmtArgList);

        assertNotNull(query);
        assertEquals(1, preparedStmtList.size());
        assertTrue(query.contains("WHERE member.is_active = ?"));
    }
}
