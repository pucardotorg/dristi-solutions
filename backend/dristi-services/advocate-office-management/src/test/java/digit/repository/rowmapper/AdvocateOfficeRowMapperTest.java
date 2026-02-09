package digit.repository.rowmapper;

import digit.web.models.AddMember;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import static digit.config.ServiceConstants.ROW_MAPPER_ERROR;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeRowMapperTest {

    @InjectMocks
    private AdvocateOfficeRowMapper rowMapper;

    @Mock
    private ResultSet resultSet;

    private String memberId;
    private String officeAdvocateId;
    private String officeAdvocateUserUuid;
    private String memberIdUuid;
    private String memberUserUuid;

    @BeforeEach
    void setUp() {
        memberId = UUID.randomUUID().toString();
        officeAdvocateId = UUID.randomUUID().toString();
        officeAdvocateUserUuid = UUID.randomUUID().toString();
        memberIdUuid = UUID.randomUUID().toString();
        memberUserUuid = UUID.randomUUID().toString();
    }

    private void setupCommonMocks() throws SQLException {
        when(resultSet.getString("tenant_id")).thenReturn("kl");
        when(resultSet.getString("office_advocate_user_uuid")).thenReturn(officeAdvocateUserUuid);
        when(resultSet.getString("office_advocate_name")).thenReturn("Office Advocate");
        when(resultSet.getString("member_user_uuid")).thenReturn(memberUserUuid);
        when(resultSet.getString("member_email")).thenReturn("test@example.com");
    }

    @Test
    void testExtractData_SingleMember() throws SQLException {
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("id")).thenReturn(memberId);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn("ADVOCATE_CLERK");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("John Doe");
        when(resultSet.getString("member_mobile_number")).thenReturn("9876543210");
        when(resultSet.getString("access_type")).thenReturn("ALL_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("creator-123");
        when(resultSet.getLong("created_time")).thenReturn(1234567890L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier-123");
        when(resultSet.getLong("last_modified_time")).thenReturn(1234567900L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(1, members.size());
        AddMember member = members.get(0);
        assertEquals(UUID.fromString(memberId), member.getId());
        assertEquals(UUID.fromString(officeAdvocateUserUuid), member.getOfficeAdvocateUserUuid());
        assertEquals(UUID.fromString(officeAdvocateId), member.getOfficeAdvocateId());
        assertEquals(MemberType.ADVOCATE_CLERK, member.getMemberType());
        assertEquals(UUID.fromString(memberUserUuid), member.getMemberUserUuid());
        assertEquals(UUID.fromString(memberIdUuid), member.getMemberId());
        assertEquals("John Doe", member.getMemberName());
        assertEquals("9876543210", member.getMemberMobileNumber());
        assertEquals(AccessType.ALL_CASES, member.getAccessType());
        assertTrue(member.getAllowCaseCreate());
        assertFalse(member.getAddNewCasesAutomatically());
        assertTrue(member.getIsActive());
        assertNotNull(member.getAuditDetails());
        assertEquals("creator-123", member.getAuditDetails().getCreatedBy());
        assertEquals(1234567890L, member.getAuditDetails().getCreatedTime());
        assertEquals("modifier-123", member.getAuditDetails().getLastModifiedBy());
        assertEquals(1234567900L, member.getAuditDetails().getLastModifiedTime());
    }

    @Test
    void testExtractData_MultipleMembers() throws SQLException {
        String memberId2 = UUID.randomUUID().toString();
        String officeAdvocateId2 = UUID.randomUUID().toString();
        String memberIdUuid2 = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true).thenReturn(true).thenReturn(false);
        
        when(resultSet.getString("id"))
                .thenReturn(memberId)
                .thenReturn(memberId2);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id"))
                .thenReturn(officeAdvocateId)
                .thenReturn(officeAdvocateId2);
        when(resultSet.getString("member_type"))
                .thenReturn("ADVOCATE_CLERK")
                .thenReturn("ADVOCATE");
        when(resultSet.getString("member_id"))
                .thenReturn(memberIdUuid)
                .thenReturn(memberIdUuid2);
        when(resultSet.getString("member_name"))
                .thenReturn("John Doe")
                .thenReturn("Jane Smith");
        when(resultSet.getString("member_mobile_number"))
                .thenReturn("9876543210")
                .thenReturn("1234567890");
        when(resultSet.getString("access_type"))
                .thenReturn("ALL_CASES")
                .thenReturn("SPECIFIC_CASES");
        when(resultSet.getBoolean("allow_case_create"))
                .thenReturn(true)
                .thenReturn(false);
        when(resultSet.getBoolean("add_new_cases_automatically"))
                .thenReturn(false)
                .thenReturn(true);
        when(resultSet.getBoolean("is_active"))
                .thenReturn(true)
                .thenReturn(false);
        when(resultSet.getString("created_by"))
                .thenReturn("creator-123")
                .thenReturn("creator-456");
        when(resultSet.getLong("created_time"))
                .thenReturn(1234567890L)
                .thenReturn(1234567800L);
        when(resultSet.getString("last_modified_by"))
                .thenReturn("modifier-123")
                .thenReturn("modifier-456");
        when(resultSet.getLong("last_modified_time"))
                .thenReturn(1234567900L)
                .thenReturn(1234567850L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(2, members.size());
        
        AddMember member1 = members.get(0);
        assertEquals("John Doe", member1.getMemberName());
        assertEquals(MemberType.ADVOCATE_CLERK, member1.getMemberType());
        assertEquals(AccessType.ALL_CASES, member1.getAccessType());
        assertTrue(member1.getIsActive());

        AddMember member2 = members.get(1);
        assertEquals("Jane Smith", member2.getMemberName());
        assertEquals(MemberType.ADVOCATE, member2.getMemberType());
        assertEquals(AccessType.SPECIFIC_CASES, member2.getAccessType());
        assertFalse(member2.getIsActive());
    }

    @Test
    void testExtractData_EmptyResultSet() throws SQLException {
        when(resultSet.next()).thenReturn(false);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertTrue(members.isEmpty());
    }

    @Test
    void testExtractData_NullAccessType() throws SQLException {
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("id")).thenReturn(memberId);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn("ADVOCATE");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test User");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type")).thenReturn(null);
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(1, members.size());
        assertEquals(AccessType.ALL_CASES, members.get(0).getAccessType());
    }

    @Test
    void testExtractData_NullMemberType() throws SQLException {
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("id")).thenReturn(memberId);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn(null);
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test User");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type")).thenReturn("ALL_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(1, members.size());
        assertNull(members.get(0).getMemberType());
    }

    @Test
    void testExtractData_DuplicateIdInResultSet() throws SQLException {
        when(resultSet.next()).thenReturn(true).thenReturn(true).thenReturn(false);
        
        when(resultSet.getString("id")).thenReturn(memberId).thenReturn(memberId);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn("ADVOCATE");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test User");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type")).thenReturn("ALL_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(1, members.size());
    }

    @Test
    void testExtractData_SQLException() throws SQLException {
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("id")).thenThrow(new SQLException("Database error"));

        CustomException exception = assertThrows(CustomException.class, () -> {
            rowMapper.extractData(resultSet);
        });

        assertEquals(ROW_MAPPER_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains("Database error"));
    }

    @Test
    void testExtractData_InvalidUUID() throws SQLException {
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("id")).thenReturn("invalid-uuid");

        CustomException exception = assertThrows(CustomException.class, () -> {
            rowMapper.extractData(resultSet);
        });

        assertEquals(ROW_MAPPER_ERROR, exception.getCode());
    }

    @Test
    void testExtractData_AllBooleansFalse() throws SQLException {
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("id")).thenReturn(memberId);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn("ADVOCATE_CLERK");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test User");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type")).thenReturn("SPECIFIC_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(false);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(false);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(1, members.size());
        AddMember member = members.get(0);
        assertFalse(member.getAllowCaseCreate());
        assertFalse(member.getAddNewCasesAutomatically());
        assertFalse(member.getIsActive());
    }

    @Test
    void testExtractData_VerifyAuditDetails() throws SQLException {
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("id")).thenReturn(memberId);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn("ADVOCATE");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test User");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type")).thenReturn("ALL_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("user-123");
        when(resultSet.getLong("created_time")).thenReturn(9999999999L);
        when(resultSet.getString("last_modified_by")).thenReturn("user-456");
        when(resultSet.getLong("last_modified_time")).thenReturn(9999999998L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertNotNull(members);
        assertEquals(1, members.size());
        assertNotNull(members.get(0).getAuditDetails());
        assertEquals("user-123", members.get(0).getAuditDetails().getCreatedBy());
        assertEquals(9999999999L, members.get(0).getAuditDetails().getCreatedTime());
        assertEquals("user-456", members.get(0).getAuditDetails().getLastModifiedBy());
        assertEquals(9999999998L, members.get(0).getAuditDetails().getLastModifiedTime());
    }

    @Test
    void testExtractData_AllMemberTypes() throws SQLException {
        String memberId1 = UUID.randomUUID().toString();
        String memberId2 = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true).thenReturn(true).thenReturn(false);
        
        when(resultSet.getString("id"))
                .thenReturn(memberId1)
                .thenReturn(memberId2);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type"))
                .thenReturn("ADVOCATE")
                .thenReturn("ADVOCATE_CLERK");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type")).thenReturn("ALL_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertEquals(2, members.size());
        assertEquals(MemberType.ADVOCATE, members.get(0).getMemberType());
        assertEquals(MemberType.ADVOCATE_CLERK, members.get(1).getMemberType());
    }

    @Test
    void testExtractData_AllAccessTypes() throws SQLException {
        String memberId1 = UUID.randomUUID().toString();
        String memberId2 = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true).thenReturn(true).thenReturn(false);
        
        when(resultSet.getString("id"))
                .thenReturn(memberId1)
                .thenReturn(memberId2);
        setupCommonMocks();
        when(resultSet.getString("office_advocate_id")).thenReturn(officeAdvocateId);
        when(resultSet.getString("member_type")).thenReturn("ADVOCATE");
        when(resultSet.getString("member_id")).thenReturn(memberIdUuid);
        when(resultSet.getString("member_name")).thenReturn("Test");
        when(resultSet.getString("member_mobile_number")).thenReturn("1234567890");
        when(resultSet.getString("access_type"))
                .thenReturn("ALL_CASES")
                .thenReturn("SPECIFIC_CASES");
        when(resultSet.getBoolean("allow_case_create")).thenReturn(true);
        when(resultSet.getBoolean("add_new_cases_automatically")).thenReturn(false);
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);

        List<AddMember> members = rowMapper.extractData(resultSet);

        assertEquals(2, members.size());
        assertEquals(AccessType.ALL_CASES, members.get(0).getAccessType());
        assertEquals(AccessType.SPECIFIC_CASES, members.get(1).getAccessType());
    }
}
