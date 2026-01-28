package digit.validator;

import digit.repository.AdvocateOfficeRepository;
import digit.util.AdvocateUtil;
import digit.util.IndividualUtil;
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
    private final IndividualUtil individualUtil;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public AdvocateOfficeValidator(AdvocateOfficeRepository advocateOfficeRepository, IndividualUtil individualUtil, AdvocateUtil advocateUtil) {
        this.advocateOfficeRepository = advocateOfficeRepository;
        this.individualUtil = individualUtil;
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

    private void validateAdvocate(RequestInfo requestInfo, String tenantId, String officeAdvocateId){
        String individualId = individualUtil.getIndividualIdFromUserUuid(requestInfo, tenantId, officeAdvocateId);
        advocateUtil.validateActiveAdvocateExists(requestInfo, individualId);
    }

    private void validateMember(RequestInfo requestInfo, String tenantId, MemberType memberType, String memberId) {
        String individualId = individualUtil.getIndividualIdFromUserUuid(requestInfo, tenantId, memberId);
        if (MemberType.ADVOCATE_CLERK.equals(memberType)) {
            advocateUtil.validateActiveClerkExists(requestInfo, tenantId, individualId);
        } else {
            advocateUtil.validateActiveAdvocateExists(requestInfo, individualId);
        }
    }

    public void validateAddMemberRequest(AddMemberRequest request) {
        AddMember addMember = request.getAddMember();

        validateRequestInfo(request.getRequestInfo());

        UUID userUuidAsUuid = UUID.fromString(request.getRequestInfo().getUserInfo().getUuid());

        if (!addMember.getOfficeAdvocateUserUuid().equals(userUuidAsUuid)) {
            throw new CustomException(UNAUTHORIZED, CANNOT_ADD_MEMBER_MESSAGE);
        }

        validateAdvocate(request.getRequestInfo(), addMember.getTenantId(), addMember.getOfficeAdvocateUserUuid().toString());

        validateMember(request.getRequestInfo(), addMember.getTenantId(), addMember.getMemberType(), addMember.getMemberUserUuid().toString());

        // Check if member already exists in the office
        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(addMember.getOfficeAdvocateUserUuid())
                .memberId(addMember.getMemberUserUuid())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (!existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_ALREADY_EXISTS, MEMBER_ALREADY_EXISTS_MESSAGE);
        }

    }

    public void validateLeaveOfficeRequest(LeaveOfficeRequest request) {
        LeaveOffice leaveOffice = request.getLeaveOffice();

        validateRequestInfo(request.getRequestInfo());

        UUID userUuidAsUuid = UUID.fromString(request.getRequestInfo().getUserInfo().getUuid());

        boolean isUserAdvocate = leaveOffice.getOfficeAdvocateUserUuid().equals(userUuidAsUuid);
        boolean isUserMember = leaveOffice.getMemberId().equals(userUuidAsUuid);
        if (!isUserAdvocate && !isUserMember) {
            throw new CustomException(UNAUTHORIZED, CANNOT_LEAVE_OFFICE_MESSAGE);
        }

        // Check if member exists in the office
        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(leaveOffice.getOfficeAdvocateUserUuid())
                .memberId(leaveOffice.getMemberId())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_NOT_FOUND, MEMBER_NOT_FOUND_MESSAGE);
        }

        AddMember existingMember = existingMembers.get(0);
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
}
