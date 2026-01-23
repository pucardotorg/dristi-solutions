package digit.validator;

import digit.repository.AdvocateOfficeRepository;
import digit.util.AdvocateUtil;
import digit.util.IndividualUtil;
import digit.web.models.*;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static digit.config.ServiceConstants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeValidatorTest {

    @Mock
    private AdvocateOfficeRepository advocateOfficeRepository;

    @Mock
    private IndividualUtil individualUtil;

    @Mock
    private AdvocateUtil advocateUtil;

    @InjectMocks
    private AdvocateOfficeValidator validator;

    private UUID officeAdvocateId;
    private UUID memberId;
    private AddMemberRequest addMemberRequest;
    private LeaveOfficeRequest leaveOfficeRequest;
    private MemberSearchRequest searchRequest;

    @BeforeEach
    void setUp() {
        officeAdvocateId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        memberId = UUID.fromString("660e8400-e29b-41d4-a716-446655440000");

        RequestInfo requestInfo = RequestInfo.builder()
                .apiId("test-api-id")
                .msgId("test-msg-id")
                .userInfo(User.builder()
                        .uuid(officeAdvocateId.toString())
                        .build())
                .build();

        AddMember addMember = AddMember.builder()
                .id(UUID.randomUUID())
                .tenantId("pg.citya")
                .officeAdvocateId(officeAdvocateId)
                .memberId(memberId)
                .memberType(MemberType.ADVOCATE_CLERK)
                .memberName("John Doe")
                .memberMobileNumber("9876543210")
                .accessType(AccessType.ALL_CASES)
                .allowCaseCreate(true)
                .addNewCasesAutomatically(false)
                .isActive(true)
                .build();

        addMemberRequest = AddMemberRequest.builder()
                .requestInfo(requestInfo)
                .addMember(addMember)
                .build();

        LeaveOffice leaveOffice = LeaveOffice.builder()
                .id(UUID.randomUUID())
                .tenantId("pg.citya")
                .officeAdvocateId(officeAdvocateId)
                .memberId(memberId)
                .isActive(false)
                .build();

        leaveOfficeRequest = LeaveOfficeRequest.builder()
                .requestInfo(requestInfo)
                .leaveOffice(leaveOffice)
                .build();

        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(officeAdvocateId)
                .build();

        searchRequest = MemberSearchRequest.builder()
                .requestInfo(requestInfo)
                .searchCriteria(searchCriteria)
                .build();
    }

    @Test
    void testValidateAddMemberRequest_Success() {
        when(individualUtil.getIndividualIdFromUserUuid(any(), anyString(), anyString()))
                .thenReturn("individual-id-123");
        doNothing().when(advocateUtil).validateActiveAdvocateExists(any(), anyString());
        doNothing().when(advocateUtil).validateActiveClerkExists(any(), anyString(), anyString());
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> validator.validateAddMemberRequest(addMemberRequest));

        verify(individualUtil, times(2)).getIndividualIdFromUserUuid(any(), anyString(), anyString());
        verify(advocateUtil, times(1)).validateActiveAdvocateExists(any(), anyString());
        verify(advocateUtil, times(1)).validateActiveClerkExists(any(), anyString(), anyString());
        verify(advocateOfficeRepository, times(1)).getMembers(any(), any());
    }

    @Test
    void testValidateAddMemberRequest_NullUserInfo() {
        addMemberRequest.getRequestInfo().setUserInfo(null);

        CustomException exception = assertThrows(CustomException.class, () -> validator.validateAddMemberRequest(addMemberRequest));

        assertEquals(USER_INFO_ERROR, exception.getCode());
        assertEquals(USER_INFO_NULL_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateAddMemberRequest_NullUserUuid() {
        addMemberRequest.getRequestInfo().getUserInfo().setUuid(null);

        CustomException exception = assertThrows(CustomException.class, () -> validator.validateAddMemberRequest(addMemberRequest));

        assertEquals(USER_INFO_ERROR, exception.getCode());
        assertEquals(USER_UUID_NULL_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateAddMemberRequest_InvalidUuidFormat() {
        addMemberRequest.getRequestInfo().getUserInfo().setUuid("invalid-uuid");

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateAddMemberRequest(addMemberRequest);
        });

        assertEquals(USER_INFO_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains("not in correct format"));
    }

    @Test
    void testValidateAddMemberRequest_UnauthorizedUser() {
        addMemberRequest.getRequestInfo().getUserInfo().setUuid(UUID.randomUUID().toString());

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateAddMemberRequest(addMemberRequest);
        });

        assertEquals(UNAUTHORIZED, exception.getCode());
        assertEquals(CANNOT_ADD_MEMBER_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateAddMemberRequest_MemberAlreadyExists() {
        when(individualUtil.getIndividualIdFromUserUuid(any(), anyString(), anyString()))
                .thenReturn("individual-id-123");
        doNothing().when(advocateUtil).validateActiveAdvocateExists(any(), anyString());
        doNothing().when(advocateUtil).validateActiveClerkExists(any(), anyString(), anyString());
        
        List<AddMember> existingMembers = Collections.singletonList(
                AddMember.builder()
                        .id(UUID.randomUUID())
                        .officeAdvocateId(officeAdvocateId)
                        .memberId(memberId)
                        .build()
        );
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(existingMembers);

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateAddMemberRequest(addMemberRequest);
        });

        assertEquals(MEMBER_ALREADY_EXISTS, exception.getCode());
        assertEquals(MEMBER_ALREADY_EXISTS_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateAddMemberRequest_AdvocateMemberType() {
        addMemberRequest.getAddMember().setMemberType(MemberType.ADVOCATE);

        when(individualUtil.getIndividualIdFromUserUuid(any(), anyString(), anyString()))
                .thenReturn("individual-id-123");
        doNothing().when(advocateUtil).validateActiveAdvocateExists(any(), anyString());
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> validator.validateAddMemberRequest(addMemberRequest));

        verify(advocateUtil, times(2)).validateActiveAdvocateExists(any(), anyString());
        verify(advocateUtil, never()).validateActiveClerkExists(any(), anyString(), anyString());
    }

    @Test
    void testValidateLeaveOfficeRequest_Success_AsAdvocate() {
        AddMember existingMember = AddMember.builder()
                .id(UUID.randomUUID())
                .officeAdvocateId(officeAdvocateId)
                .memberId(memberId)
                .memberName("John Doe")
                .memberMobileNumber("9876543210")
                .accessType(AccessType.ALL_CASES)
                .allowCaseCreate(true)
                .addNewCasesAutomatically(false)
                .auditDetails(AuditDetails.builder()
                        .createdBy("creator-uuid")
                        .createdTime(System.currentTimeMillis() - 10000)
                        .build())
                .build();

        when(advocateOfficeRepository.getMembers(any(), any()))
                .thenReturn(Collections.singletonList(existingMember));

        assertDoesNotThrow(() -> validator.validateLeaveOfficeRequest(leaveOfficeRequest));

        verify(advocateOfficeRepository, times(1)).getMembers(any(), any());
        assertNotNull(leaveOfficeRequest.getLeaveOffice().getMemberName());
        assertNotNull(leaveOfficeRequest.getLeaveOffice().getAuditDetails());
    }

    @Test
    void testValidateLeaveOfficeRequest_Success_AsMember() {
        leaveOfficeRequest.getRequestInfo().getUserInfo().setUuid(memberId.toString());

        AddMember existingMember = AddMember.builder()
                .id(UUID.randomUUID())
                .officeAdvocateId(officeAdvocateId)
                .memberId(memberId)
                .memberName("John Doe")
                .memberMobileNumber("9876543210")
                .accessType(AccessType.ALL_CASES)
                .allowCaseCreate(true)
                .addNewCasesAutomatically(false)
                .auditDetails(AuditDetails.builder()
                        .createdBy("creator-uuid")
                        .createdTime(System.currentTimeMillis() - 10000)
                        .build())
                .build();

        when(advocateOfficeRepository.getMembers(any(), any()))
                .thenReturn(Collections.singletonList(existingMember));

        assertDoesNotThrow(() -> validator.validateLeaveOfficeRequest(leaveOfficeRequest));

        verify(advocateOfficeRepository, times(1)).getMembers(any(), any());
    }

    @Test
    void testValidateLeaveOfficeRequest_UnauthorizedUser() {
        leaveOfficeRequest.getRequestInfo().getUserInfo().setUuid(UUID.randomUUID().toString());

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateLeaveOfficeRequest(leaveOfficeRequest);
        });

        assertEquals(UNAUTHORIZED, exception.getCode());
        assertEquals(CANNOT_LEAVE_OFFICE_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateLeaveOfficeRequest_MemberNotFound() {
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(Collections.emptyList());

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateLeaveOfficeRequest(leaveOfficeRequest);
        });

        assertEquals(MEMBER_NOT_FOUND, exception.getCode());
        assertEquals(MEMBER_NOT_FOUND_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateLeaveOfficeRequest_NullUserInfo() {
        leaveOfficeRequest.getRequestInfo().setUserInfo(null);

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateLeaveOfficeRequest(leaveOfficeRequest);
        });

        assertEquals(USER_INFO_ERROR, exception.getCode());
    }

    @Test
    void testValidateSearchRequest_Success() {
        assertDoesNotThrow(() -> validator.validateSearchRequest(searchRequest));
    }

    @Test
    void testValidateSearchRequest_NullSearchCriteria() {
        searchRequest.setSearchCriteria(null);

        CustomException exception = assertThrows(CustomException.class, () -> {
            validator.validateSearchRequest(searchRequest);
        });

        assertEquals(SEARCH_CRITERIA_NULL, exception.getCode());
        assertEquals(SEARCH_CRITERIA_NULL_MESSAGE, exception.getMessage());
    }

    @Test
    void testValidateLeaveOfficeRequest_EnrichesAuditDetails() {
        AddMember existingMember = AddMember.builder()
                .id(UUID.randomUUID())
                .officeAdvocateId(officeAdvocateId)
                .memberId(memberId)
                .memberName("John Doe")
                .memberMobileNumber("9876543210")
                .accessType(AccessType.ALL_CASES)
                .allowCaseCreate(true)
                .addNewCasesAutomatically(false)
                .auditDetails(AuditDetails.builder()
                        .createdBy("original-creator")
                        .createdTime(1000L)
                        .build())
                .build();

        when(advocateOfficeRepository.getMembers(any(), any()))
                .thenReturn(Collections.singletonList(existingMember));

        validator.validateLeaveOfficeRequest(leaveOfficeRequest);

        AuditDetails auditDetails = leaveOfficeRequest.getLeaveOffice().getAuditDetails();
        assertNotNull(auditDetails);
        assertEquals("original-creator", auditDetails.getCreatedBy());
        assertEquals(1000L, auditDetails.getCreatedTime());
        assertEquals(officeAdvocateId.toString(), auditDetails.getLastModifiedBy());
        assertNotNull(auditDetails.getLastModifiedTime());
    }
}
