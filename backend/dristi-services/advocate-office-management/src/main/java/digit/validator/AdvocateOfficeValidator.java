package digit.validator;

import com.fasterxml.jackson.databind.JsonNode;
import digit.repository.AdvocateOfficeRepository;
import digit.util.AdvocateUtil;
import digit.web.models.*;
import digit.web.models.enums.MemberType;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class AdvocateOfficeValidator {

    private final AdvocateOfficeRepository advocateOfficeRepository;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public AdvocateOfficeValidator(AdvocateOfficeRepository advocateOfficeRepository, AdvocateUtil advocateUtil) {
        this.advocateOfficeRepository = advocateOfficeRepository;
        this.advocateUtil = advocateUtil;
    }

    private void validateRequestInfo(RequestInfo requestInfo){
        if(requestInfo.getUserInfo() == null){
            throw new CustomException(USER_INFO_ERROR, USER_INFO_NULL_MESSAGE);
        }

        if(requestInfo.getUserInfo().getUuid() == null){
            throw new CustomException(USER_INFO_ERROR, USER_UUID_NULL_MESSAGE);
        }

        String uuidStr = requestInfo.getUserInfo().getUuid();
        try{
            UUID.fromString(uuidStr);
        } catch (IllegalArgumentException e) {
            throw new CustomException(USER_INFO_ERROR, String.format("User uuid %s not in correct format", uuidStr));
        }
    }

    private void validateActiveAdvocateById(RequestInfo requestInfo, String tenantId, String advocateId) {
        JsonNode advocate = advocateUtil.searchAdvocateById(requestInfo, tenantId, advocateId);
        if (advocate == null) {
            throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
        }
        if (!advocateUtil.isActive(advocate)) {
            throw new CustomException(ADVOCATE_NOT_FOUND, ADVOCATE_NOT_FOUND_MESSAGE);
        }
    }

    private void validateActiveMemberById(RequestInfo requestInfo, String tenantId, MemberType memberType, String memberId) {
        if (MemberType.ADVOCATE_CLERK.equals(memberType)) {
            JsonNode advocateClerk = advocateUtil.searchClerkById(requestInfo, tenantId, memberId);
            if (advocateClerk == null) {
                throw new CustomException(ADVOCATE_CLERK_NOT_FOUND, ADVOCATE_CLERK_NOT_FOUND_MESSAGE);
            }
            if (!advocateUtil.isActive(advocateClerk)) {
                throw new CustomException(ADVOCATE_CLERK_NOT_FOUND, ADVOCATE_CLERK_NOT_FOUND_MESSAGE);
            }
        } else {
            validateActiveAdvocateById(requestInfo, tenantId, memberId);
        }
    }

    public void validateAddMemberRequest(AddMemberRequest request) {
        AddMember addMember = request.getAddMember();

        validateRequestInfo(request.getRequestInfo());

        validateActiveAdvocateById(request.getRequestInfo(), addMember.getTenantId(), addMember.getOfficeAdvocateId().toString());

        validateActiveMemberById(request.getRequestInfo(), addMember.getTenantId(), addMember.getMemberType(), addMember.getMemberId().toString());

        // Check if member already exists in the office
        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(addMember.getOfficeAdvocateId())
                .memberId(addMember.getMemberId())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (!existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_ALREADY_EXISTS, MEMBER_ALREADY_EXISTS_MESSAGE);
        }

    }

    public void validateCanAddMember(AddMemberRequest request){
        String userUuid = request.getRequestInfo().getUserInfo().getUuid();
        String advocateUuid = request.getAddMember().getOfficeAdvocateUserUuid().toString();

        if(!userUuid.equals(advocateUuid)){
            throw new CustomException(UNAUTHORIZED,
                    String.format("User is not authorized to add member to advocate %s's office", request.getAddMember().getOfficeAdvocateId()));
        }
    }

    public void validateLeaveOfficeRequest(LeaveOfficeRequest request) {
        LeaveOffice leaveOffice = request.getLeaveOffice();

        validateRequestInfo(request.getRequestInfo());

        UUID memberId = leaveOffice.getMemberId();
        UUID officeAdvocateId = leaveOffice.getOfficeAdvocateId();

        // First check if member exists in the office
        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(leaveOffice.getOfficeAdvocateId())
                .memberId(leaveOffice.getMemberId())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_NOT_FOUND,
                    String.format("Member %s not found in advocate %s's office", memberId, officeAdvocateId));
        }

        AddMember existingMember = existingMembers.get(0);

        // Then check authorization using UUIDs from the existing member record
        UUID userUuidAsUuid = UUID.fromString(request.getRequestInfo().getUserInfo().getUuid());
        boolean isUserAdvocate = existingMember.getOfficeAdvocateUserUuid().equals(userUuidAsUuid);
        boolean isUserMember = existingMember.getMemberUserUuid().equals(userUuidAsUuid);

        if (!isUserAdvocate && !isUserMember) {
            throw new CustomException(UNAUTHORIZED,
                    String.format("User is not authorized to remove member from advocate's office"));
        }

        leaveOffice.setMemberName(existingMember.getMemberName());
        leaveOffice.setMemberMobileNumber(existingMember.getMemberMobileNumber());
        leaveOffice.setAccessType(existingMember.getAccessType());
        leaveOffice.setAllowCaseCreate(existingMember.getAllowCaseCreate());
        leaveOffice.setAddNewCasesAutomatically(existingMember.getAddNewCasesAutomatically());

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(existingMember.getAuditDetails().getCreatedBy())
                .createdTime(existingMember.getAuditDetails().getCreatedTime())
                .lastModifiedBy(request.getRequestInfo().getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis())
                .build();
        leaveOffice.setAuditDetails(auditDetails);
    }

    public void validateSearchRequest(MemberSearchRequest request) {
        if (request.getSearchCriteria() == null) {
            throw new CustomException(SEARCH_CRITERIA_NULL, SEARCH_CRITERIA_NULL_MESSAGE);
        }
    }

    public AddMember validateUpdateMemberAccessRequest(UpdateMemberAccessRequest request) {
        validateRequestInfo(request.getRequestInfo());

        UpdateMemberAccess updateMemberAccess = request.getUpdateMemberAccess();
        if (updateMemberAccess == null) {
            throw new CustomException(UPDATE_MEMBER_ACCESS_ERROR, "Update member access payload cannot be null");
        }

        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(updateMemberAccess.getOfficeAdvocateId())
                .memberId(updateMemberAccess.getMemberId())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_NOT_FOUND, MEMBER_NOT_FOUND_MESSAGE);
        }

        AddMember existingMember = getMember(existingMembers);

        String userUuid = request.getRequestInfo().getUserInfo().getUuid();
        if (!existingMember.getOfficeAdvocateUserUuid().toString().equals(userUuid)) {
            throw new CustomException(UNAUTHORIZED, "User is not authorized to update access for member");
        }

        return existingMember;

    }

    private AddMember getMember(List<AddMember> existingMembers) {
        AddMember existingMember = existingMembers.get(0);

        if (!Boolean.TRUE.equals(existingMember.getIsActive())) {
            throw new CustomException(MEMBER_NOT_FOUND, MEMBER_NOT_FOUND_MESSAGE);
        }

        return existingMember;
    }

    public void validateProcessCaseMemberRequest(ProcessCaseMemberRequest request) {

        validateRequestInfo(request.getRequestInfo());

        ProcessCaseMember processCaseMember = request.getProcessCaseMember();

        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateUserUuid(processCaseMember.getAdvocateUserUuid())
                .memberUserUuid(processCaseMember.getMemberUserUuid())
                .isActive(true)
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_NOT_FOUND, MEMBER_NOT_FOUND_MESSAGE);
        }

        List<String> addCaseIds = processCaseMember.getAddCaseIds();

        List<String> removeCaseIds = processCaseMember.getRemoveCaseIds();

        if ((addCaseIds == null || addCaseIds.isEmpty()) && (removeCaseIds == null || removeCaseIds.isEmpty())) {
            throw new CustomException("INVALID_REQUEST", "Either addCaseIds or removeCaseIds must be provided");
        }

    }
}
