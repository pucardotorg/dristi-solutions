package digit.web.controllers;

import digit.service.AdvocateOfficeService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeApiControllerTest {

    @Mock
    private AdvocateOfficeService advocateOfficeService;

    @Mock
    private ResponseInfoFactory responseInfoFactory;

    @InjectMocks
    private AdvocateOfficeApiController controller;

    private RequestInfo requestInfo;
    private ResponseInfo responseInfo;
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

        responseInfo = ResponseInfo.builder()
                .apiId("test-api-id")
                .msgId("test-msg-id")
                .status("successful")
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
        when(advocateOfficeService.addMember(any())).thenReturn(addMemberRequest.getAddMember());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<AddMemberResponse> response = controller.advocateOfficeV1AddMemberPost(addMemberRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(addMemberRequest.getAddMember().getId(), response.getBody().getAddMember().getId());
        assertEquals("successful", response.getBody().getResponseInfo().getStatus());

        verify(advocateOfficeService, times(1)).addMember(addMemberRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    void testAddMember_ServiceThrowsException() {
        when(advocateOfficeService.addMember(any()))
                .thenThrow(new CustomException("VALIDATION_ERROR", "Validation failed"));

        assertThrows(CustomException.class, () -> {
            controller.advocateOfficeV1AddMemberPost(addMemberRequest);
        });

        verify(advocateOfficeService, times(1)).addMember(addMemberRequest);
        verify(responseInfoFactory, never()).createResponseInfoFromRequestInfo(any(), anyBoolean());
    }

    @Test
    void testAddMember_WithDifferentMemberType() {
        addMemberRequest.getAddMember().setMemberType(MemberType.ADVOCATE);

        when(advocateOfficeService.addMember(any())).thenReturn(addMemberRequest.getAddMember());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<AddMemberResponse> response = controller.advocateOfficeV1AddMemberPost(addMemberRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MemberType.ADVOCATE, response.getBody().getAddMember().getMemberType());
    }

    @Test
    void testLeaveOffice_Success() {
        when(advocateOfficeService.leaveOffice(any())).thenReturn(leaveOfficeRequest.getLeaveOffice());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<LeaveOfficeResponse> response = controller.advocateOfficeV1LeaveOfficePost(leaveOfficeRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(leaveOfficeRequest.getLeaveOffice().getId(), response.getBody().getLeaveOffice().getId());
        assertEquals("successful", response.getBody().getResponseInfo().getStatus());

        verify(advocateOfficeService, times(1)).leaveOffice(leaveOfficeRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    void testLeaveOffice_ServiceThrowsException() {
        when(advocateOfficeService.leaveOffice(any()))
                .thenThrow(new CustomException("MEMBER_NOT_FOUND", "Member not found"));

        assertThrows(CustomException.class, () -> {
            controller.advocateOfficeV1LeaveOfficePost(leaveOfficeRequest);
        });

        verify(advocateOfficeService, times(1)).leaveOffice(leaveOfficeRequest);
        verify(responseInfoFactory, never()).createResponseInfoFromRequestInfo(any(), anyBoolean());
    }

    @Test
    void testLeaveOffice_VerifyIsActiveSetToFalse() {
        when(advocateOfficeService.leaveOffice(any())).thenReturn(leaveOfficeRequest.getLeaveOffice());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<LeaveOfficeResponse> response = controller.advocateOfficeV1LeaveOfficePost(leaveOfficeRequest);

        assertNotNull(response);
        assertFalse(response.getBody().getLeaveOffice().getIsActive());
    }

    @Test
    void testSearchMembers_Success() {
        List<AddMember> members = Arrays.asList(
                addMemberRequest.getAddMember(),
                AddMember.builder()
                        .id(UUID.randomUUID())
                        .tenantId("pg.citya")
                        .officeAdvocateId(UUID.randomUUID())
                        .memberId(UUID.randomUUID())
                        .memberType(MemberType.ADVOCATE)
                        .build()
        );

        when(advocateOfficeService.searchMembers(any())).thenReturn(members);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<MemberSearchResponse> response = controller.advocateOfficeV1SearchMemberPost(searchRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getMembers().size());
        assertEquals(2, response.getBody().getTotalCount());
        assertEquals("successful", response.getBody().getResponseInfo().getStatus());

        verify(advocateOfficeService, times(1)).searchMembers(searchRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    void testSearchMembers_EmptyResult() {
        when(advocateOfficeService.searchMembers(any())).thenReturn(Collections.emptyList());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<MemberSearchResponse> response = controller.advocateOfficeV1SearchMemberPost(searchRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertTrue(response.getBody().getMembers().isEmpty());
        assertEquals(0, response.getBody().getTotalCount());
    }

    @Test
    void testSearchMembers_WithPagination() {
        Pagination pagination = Pagination.builder()
                .limit(10.0)
                .offSet(0.0)
                .totalCount(25.0)
                .build();
        searchRequest.setPagination(pagination);

        List<AddMember> members = Collections.singletonList(addMemberRequest.getAddMember());

        when(advocateOfficeService.searchMembers(any())).thenReturn(members);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<MemberSearchResponse> response = controller.advocateOfficeV1SearchMemberPost(searchRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertEquals(1, response.getBody().getMembers().size());
        assertEquals(25, response.getBody().getTotalCount());
        assertNotNull(response.getBody().getPagination());
        assertEquals(25.0, response.getBody().getPagination().getTotalCount());
    }

    @Test
    void testSearchMembers_ServiceThrowsException() {
        when(advocateOfficeService.searchMembers(any()))
                .thenThrow(new CustomException("SEARCH_ERROR", "Search failed"));

        assertThrows(CustomException.class, () -> {
            controller.advocateOfficeV1SearchMemberPost(searchRequest);
        });

        verify(advocateOfficeService, times(1)).searchMembers(searchRequest);
        verify(responseInfoFactory, never()).createResponseInfoFromRequestInfo(any(), anyBoolean());
    }

    @Test
    void testSearchMembers_NullPagination() {
        List<AddMember> members = Collections.singletonList(addMemberRequest.getAddMember());

        when(advocateOfficeService.searchMembers(any())).thenReturn(members);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<MemberSearchResponse> response = controller.advocateOfficeV1SearchMemberPost(searchRequest);

        assertNotNull(response);
        assertEquals(1, response.getBody().getTotalCount());
    }

    @Test
    void testAddMember_ResponseInfoCreation() {
        when(advocateOfficeService.addMember(any())).thenReturn(addMemberRequest.getAddMember());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
                .thenReturn(responseInfo);

        ResponseEntity<AddMemberResponse> response = controller.advocateOfficeV1AddMemberPost(addMemberRequest);

        assertNotNull(response.getBody().getResponseInfo());
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    void testLeaveOffice_ResponseInfoCreation() {
        when(advocateOfficeService.leaveOffice(any())).thenReturn(leaveOfficeRequest.getLeaveOffice());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
                .thenReturn(responseInfo);

        ResponseEntity<LeaveOfficeResponse> response = controller.advocateOfficeV1LeaveOfficePost(leaveOfficeRequest);

        assertNotNull(response.getBody().getResponseInfo());
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    void testSearchMembers_ResponseInfoCreation() {
        when(advocateOfficeService.searchMembers(any())).thenReturn(Collections.emptyList());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
                .thenReturn(responseInfo);

        ResponseEntity<MemberSearchResponse> response = controller.advocateOfficeV1SearchMemberPost(searchRequest);

        assertNotNull(response.getBody().getResponseInfo());
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }
}
