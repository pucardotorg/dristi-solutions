package digit.enrichment;

import digit.web.models.AddMember;
import digit.web.models.AddMemberRequest;
import digit.web.models.LeaveOffice;
import digit.web.models.LeaveOfficeRequest;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AdvocateOfficeEnrichmentTest {

    @InjectMocks
    private AdvocateOfficeEnrichment enrichment;

    private RequestInfo requestInfo;
    private AddMemberRequest addMemberRequest;
    private LeaveOfficeRequest leaveOfficeRequest;

    @BeforeEach
    void setUp() {
        String userUuid = "user-uuid-123";
        requestInfo = RequestInfo.builder()
                .apiId("test-api-id")
                .msgId("test-msg-id")
                .userInfo(User.builder()
                        .uuid(userUuid)
                        .build())
                .build();

        UUID officeAdvocateId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        UUID memberId = UUID.fromString("660e8400-e29b-41d4-a716-446655440000");

        AddMember addMember = AddMember.builder()
                .tenantId("pg.citya")
                .officeAdvocateId(officeAdvocateId)
                .memberId(memberId)
                .memberType(MemberType.ADVOCATE_CLERK)
                .memberName("John Doe")
                .memberMobileNumber("9876543210")
                .accessType(AccessType.ALL_CASES)
                .allowCaseCreate(true)
                .addNewCasesAutomatically(false)
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
                .build();

        leaveOfficeRequest = LeaveOfficeRequest.builder()
                .requestInfo(requestInfo)
                .leaveOffice(leaveOffice)
                .build();
    }

    @Test
    void testEnrichAddMemberRequest_AddsIdAndAuditDetails() {
        assertNull(addMemberRequest.getAddMember().getId());
        assertNull(addMemberRequest.getAddMember().getAuditDetails());
        assertNull(addMemberRequest.getAddMember().getIsActive());

        long beforeEnrichment = System.currentTimeMillis();
        enrichment.enrichAddMemberRequest(addMemberRequest);
        long afterEnrichment = System.currentTimeMillis();

        assertNotNull(addMemberRequest.getAddMember().getId());
        assertNotNull(addMemberRequest.getAddMember().getAuditDetails());
        assertTrue(addMemberRequest.getAddMember().getIsActive());

        assertEquals("user-uuid-123", addMemberRequest.getAddMember().getAuditDetails().getCreatedBy());
        assertEquals("user-uuid-123", addMemberRequest.getAddMember().getAuditDetails().getLastModifiedBy());
        assertTrue(addMemberRequest.getAddMember().getAuditDetails().getCreatedTime() >= beforeEnrichment);
        assertTrue(addMemberRequest.getAddMember().getAuditDetails().getCreatedTime() <= afterEnrichment);
        assertEquals(addMemberRequest.getAddMember().getAuditDetails().getCreatedTime(),
                addMemberRequest.getAddMember().getAuditDetails().getLastModifiedTime());
    }

    @Test
    void testEnrichAddMemberRequest_GeneratesUniqueIds() {
        AddMember addMember1 = AddMember.builder()
                .tenantId("pg.citya")
                .build();
        AddMemberRequest request1 = AddMemberRequest.builder()
                .requestInfo(requestInfo)
                .addMember(addMember1)
                .build();

        AddMember addMember2 = AddMember.builder()
                .tenantId("pg.citya")
                .build();
        AddMemberRequest request2 = AddMemberRequest.builder()
                .requestInfo(requestInfo)
                .addMember(addMember2)
                .build();

        enrichment.enrichAddMemberRequest(request1);
        enrichment.enrichAddMemberRequest(request2);

        assertNotNull(request1.getAddMember().getId());
        assertNotNull(request2.getAddMember().getId());
        assertNotEquals(request1.getAddMember().getId(), request2.getAddMember().getId());
    }

    @Test
    void testEnrichLeaveOfficeRequest_SetsIsActiveToFalse() {
        assertNull(leaveOfficeRequest.getLeaveOffice().getIsActive());

        enrichment.enrichLeaveOfficeRequest(leaveOfficeRequest);

        assertNotNull(leaveOfficeRequest.getLeaveOffice().getIsActive());
        assertFalse(leaveOfficeRequest.getLeaveOffice().getIsActive());
    }

    @Test
    void testEnrichLeaveOfficeRequest_PreservesExistingData() {
        UUID originalId = leaveOfficeRequest.getLeaveOffice().getId();
        String originalTenantId = leaveOfficeRequest.getLeaveOffice().getTenantId();
        UUID originalOfficeAdvocateId = leaveOfficeRequest.getLeaveOffice().getOfficeAdvocateId();
        UUID originalMemberId = leaveOfficeRequest.getLeaveOffice().getMemberId();

        enrichment.enrichLeaveOfficeRequest(leaveOfficeRequest);

        assertEquals(originalId, leaveOfficeRequest.getLeaveOffice().getId());
        assertEquals(originalTenantId, leaveOfficeRequest.getLeaveOffice().getTenantId());
        assertEquals(originalOfficeAdvocateId, leaveOfficeRequest.getLeaveOffice().getOfficeAdvocateId());
        assertEquals(originalMemberId, leaveOfficeRequest.getLeaveOffice().getMemberId());
        assertFalse(leaveOfficeRequest.getLeaveOffice().getIsActive());
    }

    @Test
    void testEnrichAddMemberRequest_AuditDetailsWithDifferentUsers() {
        String userUuid1 = "user-uuid-111";
        RequestInfo requestInfo1 = RequestInfo.builder()
                .userInfo(User.builder().uuid(userUuid1).build())
                .build();

        AddMember addMember1 = AddMember.builder().tenantId("pg.citya").build();
        AddMemberRequest request1 = AddMemberRequest.builder()
                .requestInfo(requestInfo1)
                .addMember(addMember1)
                .build();

        String userUuid2 = "user-uuid-222";
        RequestInfo requestInfo2 = RequestInfo.builder()
                .userInfo(User.builder().uuid(userUuid2).build())
                .build();

        AddMember addMember2 = AddMember.builder().tenantId("pg.citya").build();
        AddMemberRequest request2 = AddMemberRequest.builder()
                .requestInfo(requestInfo2)
                .addMember(addMember2)
                .build();

        enrichment.enrichAddMemberRequest(request1);
        enrichment.enrichAddMemberRequest(request2);

        assertEquals(userUuid1, request1.getAddMember().getAuditDetails().getCreatedBy());
        assertEquals(userUuid2, request2.getAddMember().getAuditDetails().getCreatedBy());
    }

    @Test
    void testEnrichAddMemberRequest_IsActiveSetToTrue() {
        AddMember addMember = addMemberRequest.getAddMember();
        addMember.setIsActive(false);

        enrichment.enrichAddMemberRequest(addMemberRequest);

        assertTrue(addMember.getIsActive());
    }
}
