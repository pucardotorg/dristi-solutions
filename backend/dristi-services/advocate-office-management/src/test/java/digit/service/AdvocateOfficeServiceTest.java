package digit.service;

import digit.config.Configuration;
import digit.enrichment.AdvocateOfficeEnrichment;
import digit.kafka.Producer;
import digit.repository.AdvocateOfficeRepository;
import digit.validator.AdvocateOfficeValidator;
import digit.web.models.*;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeServiceTest {

    @Mock
    private AdvocateOfficeRepository advocateOfficeRepository;

    @Mock
    private AdvocateOfficeValidator validator;

    @Mock
    private AdvocateOfficeEnrichment enrichment;

    @Mock
    private Producer producer;

    @Mock
    private Configuration configuration;

    @InjectMocks
    private AdvocateOfficeService advocateOfficeService;

    private RequestInfo requestInfo;
    private AddMemberRequest addMemberRequest;
    private LeaveOfficeRequest leaveOfficeRequest;
    private MemberSearchRequest searchRequest;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .apiId("test-api-id")
                .msgId("test-msg-id")
                .userInfo(User.builder()
                        .uuid("user-uuid-123")
                        .build())
                .build();

        UUID officeAdvocateId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        UUID memberId = UUID.fromString("660e8400-e29b-41d4-a716-446655440000");

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
    void testAddMember_Success() {
        when(configuration.getAddMemberTopic()).thenReturn("add-member-topic");
        doNothing().when(validator).validateAddMemberRequest(any());
        doNothing().when(enrichment).enrichAddMemberRequest(any());
        doNothing().when(producer).push(anyString(), any());

        AddMember result = advocateOfficeService.addMember(addMemberRequest);

        assertNotNull(result);
        assertEquals(addMemberRequest.getAddMember().getId(), result.getId());
        verify(validator, times(1)).validateAddMemberRequest(addMemberRequest);
        verify(enrichment, times(1)).enrichAddMemberRequest(addMemberRequest);
        verify(producer, times(1)).push(eq("add-member-topic"), eq(addMemberRequest));
    }

    @Test
    void testAddMember_ValidationFailure() {
        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed"))
                .when(validator).validateAddMemberRequest(any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeService.addMember(addMemberRequest);
        });

        assertEquals("VALIDATION_ERROR", exception.getCode());
        verify(enrichment, never()).enrichAddMemberRequest(any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testAddMember_UnexpectedError() {
        doThrow(new RuntimeException("Unexpected error"))
                .when(validator).validateAddMemberRequest(any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeService.addMember(addMemberRequest);
        });

        assertEquals(ADD_MEMBER_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains("Unexpected error"));
    }

    @Test
    void testLeaveOffice_Success() {
        when(configuration.getLeaveOfficeTopic()).thenReturn("leave-office-topic");
        doNothing().when(validator).validateLeaveOfficeRequest(any());
        doNothing().when(enrichment).enrichLeaveOfficeRequest(any());
        doNothing().when(producer).push(anyString(), any());

        LeaveOffice result = advocateOfficeService.leaveOffice(leaveOfficeRequest);

        assertNotNull(result);
        assertEquals(leaveOfficeRequest.getLeaveOffice().getId(), result.getId());
        verify(validator, times(1)).validateLeaveOfficeRequest(leaveOfficeRequest);
        verify(enrichment, times(1)).enrichLeaveOfficeRequest(leaveOfficeRequest);
        verify(producer, times(1)).push(eq("leave-office-topic"), eq(leaveOfficeRequest));
    }

    @Test
    void testLeaveOffice_ValidationFailure() {
        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed"))
                .when(validator).validateLeaveOfficeRequest(any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeService.leaveOffice(leaveOfficeRequest);
        });

        assertEquals("VALIDATION_ERROR", exception.getCode());
        verify(enrichment, never()).enrichLeaveOfficeRequest(any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testLeaveOffice_UnexpectedError() {
        doThrow(new RuntimeException("Unexpected error"))
                .when(validator).validateLeaveOfficeRequest(any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeService.leaveOffice(leaveOfficeRequest);
        });

        assertEquals(LEAVE_OFFICE_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains("Unexpected error"));
    }

    @Test
    void testSearchMembers_Success() {
        List<AddMember> expectedMembers = Arrays.asList(
                addMemberRequest.getAddMember(),
                AddMember.builder()
                        .id(UUID.randomUUID())
                        .tenantId("pg.citya")
                        .officeAdvocateId(UUID.randomUUID())
                        .memberId(UUID.randomUUID())
                        .memberType(MemberType.ADVOCATE)
                        .build()
        );

        doNothing().when(validator).validateSearchRequest(any());
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(expectedMembers);

        List<AddMember> result = advocateOfficeService.searchMembers(searchRequest);

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(validator, times(1)).validateSearchRequest(searchRequest);
        verify(advocateOfficeRepository, times(1)).getMembers(searchRequest.getSearchCriteria(), searchRequest.getPagination());
    }

    @Test
    void testSearchMembers_EmptyResult() {
        doNothing().when(validator).validateSearchRequest(any());
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(Collections.emptyList());

        List<AddMember> result = advocateOfficeService.searchMembers(searchRequest);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(validator, times(1)).validateSearchRequest(searchRequest);
        verify(advocateOfficeRepository, times(1)).getMembers(any(), any());
    }

    @Test
    void testSearchMembers_ValidationFailure() {
        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed"))
                .when(validator).validateSearchRequest(any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeService.searchMembers(searchRequest);
        });

        assertEquals("VALIDATION_ERROR", exception.getCode());
        verify(advocateOfficeRepository, never()).getMembers(any(), any());
    }

    @Test
    void testSearchMembers_RepositoryError() {
        doNothing().when(validator).validateSearchRequest(any());
        when(advocateOfficeRepository.getMembers(any(), any()))
                .thenThrow(new RuntimeException("Database error"));

        CustomException exception = assertThrows(CustomException.class, () -> {
            advocateOfficeService.searchMembers(searchRequest);
        });

        assertEquals(SEARCH_MEMBER_ERROR, exception.getCode());
        assertTrue(exception.getMessage().contains("Database error"));
    }

    @Test
    void testSearchMembers_WithPagination() {
        Pagination pagination = Pagination.builder()
                .limit(10.0)
                .offSet(0.0)
                .build();
        searchRequest.setPagination(pagination);

        List<AddMember> expectedMembers = Collections.singletonList(addMemberRequest.getAddMember());

        doNothing().when(validator).validateSearchRequest(any());
        when(advocateOfficeRepository.getMembers(any(), any())).thenReturn(expectedMembers);

        List<AddMember> result = advocateOfficeService.searchMembers(searchRequest);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(advocateOfficeRepository, times(1)).getMembers(searchRequest.getSearchCriteria(), pagination);
    }
}
