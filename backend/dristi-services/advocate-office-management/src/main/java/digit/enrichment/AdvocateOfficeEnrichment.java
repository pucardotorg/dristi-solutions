package digit.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import digit.util.AdvocateUtil;
import digit.util.IndividualUtil;
import digit.web.models.AddMember;
import digit.web.models.AddMemberRequest;
import digit.web.models.LeaveOffice;
import digit.web.models.LeaveOfficeRequest;
import digit.web.models.UpdateMemberAccess;
import digit.web.models.UpdateMemberAccessRequest;
import digit.web.models.enums.MemberType;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class AdvocateOfficeEnrichment {

    private final AdvocateUtil advocateUtil;
    private final IndividualUtil individualUtil;

    @Autowired
    public AdvocateOfficeEnrichment(AdvocateUtil advocateUtil, IndividualUtil individualUtil) {
        this.advocateUtil = advocateUtil;
        this.individualUtil = individualUtil;
    }

    private String getIndividualIdFromAdvocateId(RequestInfo requestInfo, String tenantId, String advocateId){
        JsonNode advocate = advocateUtil.searchAdvocateById(requestInfo, tenantId, advocateId);
        if (advocate == null) {
            throw new CustomException(ADVOCATE_NOT_FOUND,
                    String.format("Advocate not found for advocate id %s", advocateId));
        }

        return advocateUtil.getIndividualId(advocate);
    }

    private String getUserUuidFromIndividualId(RequestInfo requestInfo, String tenantId, String individualId){
        JsonNode individual = individualUtil.searchIndividualByIndividualId(requestInfo, tenantId, individualId);
        if (individual == null) {
            throw new CustomException(INDIVIDUAL_NOT_FOUND,
                    String.format("Individual not found for individual id %s", individualId));
        }

        return individualUtil.getUserUuid(individual);
    }

    private String getIndividualIdFromClerkId(RequestInfo requestInfo, String tenantId, String clerkId){
        JsonNode clerk = advocateUtil.searchClerkById(requestInfo, tenantId, clerkId);
        if (clerk == null) {
            throw new CustomException(ADVOCATE_CLERK_NOT_FOUND,
                    String.format("Advocate clerk not found for clerk id %s", clerkId));
        }

        return advocateUtil.getIndividualId(clerk);
    }

    public void enrichAddMemberRequest(AddMemberRequest request) {
        AddMember addMember = request.getAddMember();
        RequestInfo requestInfo = request.getRequestInfo();

        addMember.setId(UUID.randomUUID());
        addMember.setAuditDetails(getAuditDetailsForCreate(requestInfo));
        addMember.setIsActive(true);

        enrichOfficeAdvocateUserUuid(request);
        enrichMemberUserUuid(request);

        log.info("Enriched add member request with id: {}", addMember.getId());
    }

    private void enrichOfficeAdvocateUserUuid(AddMemberRequest request){
        AddMember addMember = request.getAddMember();
        RequestInfo requestInfo = request.getRequestInfo();
        String tenantId = addMember.getTenantId();
        String advocateId = addMember.getOfficeAdvocateId().toString();

        String advocateIndividualId = getIndividualIdFromAdvocateId(requestInfo, tenantId, advocateId);
        String advocateUserUuid = getUserUuidFromIndividualId(requestInfo, tenantId, advocateIndividualId);
        addMember.setOfficeAdvocateUserUuid(UUID.fromString(advocateUserUuid));
        log.info("Enriched officeAdvocateUserUuid: {} for officeAdvocateId: {}", advocateUserUuid, addMember.getOfficeAdvocateId());
    }

    private void enrichMemberUserUuid(AddMemberRequest request){
        AddMember addMember = request.getAddMember();
        RequestInfo requestInfo = request.getRequestInfo();
        String tenantId = addMember.getTenantId();
        String memberId = addMember.getMemberId().toString();

        String memberIndividualId;
        if (addMember.getMemberType() == MemberType.ADVOCATE) {
            memberIndividualId = getIndividualIdFromAdvocateId(requestInfo, tenantId, memberId);
        } else {
            memberIndividualId = getIndividualIdFromClerkId(requestInfo, tenantId, memberId);
        }

        String memberUserUuid = getUserUuidFromIndividualId(requestInfo, tenantId, memberIndividualId);
        addMember.setMemberUserUuid(UUID.fromString(memberUserUuid));
        log.info("Enriched memberUserUuid: {} for memberId: {}", memberUserUuid, addMember.getMemberId());
    }



    public void enrichLeaveOfficeRequest(LeaveOfficeRequest request) {
        LeaveOffice leaveOffice = request.getLeaveOffice();

        leaveOffice.setIsActive(false);

        log.info("Enriched leave office request with id: {}", leaveOffice.getId());
    }

    public void enrichUpdateMemberAccessRequest(UpdateMemberAccessRequest request, AddMember existingMember) {

        AuditDetails auditDetails = existingMember.getAuditDetails();
        auditDetails.setLastModifiedTime(System.currentTimeMillis());
        auditDetails.setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());

        request.getUpdateMemberAccess().setAuditDetails(auditDetails);

        log.info("Enriched update member access request for member {} of advocate office : {}", existingMember.getMemberUserUuid(), existingMember.getOfficeAdvocateUserUuid());
    }

    private AuditDetails getAuditDetailsForCreate(RequestInfo requestInfo) {
        User user = requestInfo.getUserInfo();
        long currentTime = System.currentTimeMillis();

        return AuditDetails.builder()
                .createdBy(user.getUuid())
                .lastModifiedBy(user.getUuid())
                .createdTime(currentTime)
                .lastModifiedTime(currentTime)
                .build();
    }

}
