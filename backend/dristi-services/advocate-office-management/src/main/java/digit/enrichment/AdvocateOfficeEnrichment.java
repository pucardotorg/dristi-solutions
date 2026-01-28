package digit.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import digit.util.AdvocateUtil;
import digit.util.IndividualUtil;
import digit.web.models.AddMember;
import digit.web.models.AddMemberRequest;
import digit.web.models.LeaveOffice;
import digit.web.models.LeaveOfficeRequest;
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

    private String getUserUuidFromAdvocateId(RequestInfo requestInfo, String tenantId, String advocateId) {
        JsonNode advocate = advocateUtil.searchAdvocateById(requestInfo, advocateId);
        if (advocate == null) {
            throw new CustomException(ADVOCATE_NOT_FOUND,
                    String.format("Advocate not found for advocate id %s", advocateId));
        }

        String individualId = advocateUtil.getIndividualId(advocate);
        JsonNode individual = individualUtil.searchIndividualByIndividualId(requestInfo, tenantId, individualId);
        if (individual == null) {
            throw new CustomException(INDIVIDUAL_NOT_FOUND,
                    String.format("Individual not found for advocate id %s", advocateId));
        }

        return individualUtil.getUserUuid(individual);
    }

    private String getUserUuidFromClerkId(RequestInfo requestInfo, String tenantId, String clerkId) {
        JsonNode clerk = advocateUtil.searchClerkById(requestInfo, tenantId, clerkId);
        if (clerk == null) {
            throw new CustomException(ADVOCATE_CLERK_NOT_FOUND,
                    String.format("Advocate clerk not found for clerk id %s", clerkId));
        }

        String individualId = advocateUtil.getIndividualId(clerk);
        JsonNode individual = individualUtil.searchIndividualByIndividualId(requestInfo, tenantId, individualId);
        if (individual == null) {
            throw new CustomException(INDIVIDUAL_NOT_FOUND, "Individual not found for clerk");
        }

        return individualUtil.getUserUuid(individual);
    }

    public void enrichAddMemberRequest(AddMemberRequest request) {
        AddMember addMember = request.getAddMember();
        RequestInfo requestInfo = request.getRequestInfo();
        String tenantId = addMember.getTenantId();

        addMember.setId(UUID.randomUUID());
        addMember.setAuditDetails(getAuditDetailsForCreate(requestInfo));
        addMember.setIsActive(true);

        // Enrich officeAdvocateUserUuid from officeAdvocateId
        if (addMember.getOfficeAdvocateId() != null && addMember.getOfficeAdvocateUserUuid() == null) {
            String advocateUserUuid = getUserUuidFromAdvocateId(requestInfo, tenantId, addMember.getOfficeAdvocateId().toString());
            addMember.setOfficeAdvocateUserUuid(UUID.fromString(advocateUserUuid));
            log.info("Enriched officeAdvocateUserUuid: {} for officeAdvocateId: {}", advocateUserUuid, addMember.getOfficeAdvocateId());
        }

        // Enrich memberUserUuid from memberId
        if (addMember.getMemberId() != null && addMember.getMemberUserUuid() == null) {
            String memberUserUuid;
            if (addMember.getMemberType() == MemberType.ADVOCATE) {
                memberUserUuid = getUserUuidFromAdvocateId(requestInfo, tenantId, addMember.getMemberId().toString());
            } else {
                memberUserUuid = getUserUuidFromClerkId(requestInfo, tenantId, addMember.getMemberId().toString());
            }
            addMember.setMemberUserUuid(UUID.fromString(memberUserUuid));
            log.info("Enriched memberUserUuid: {} for memberId: {}", memberUserUuid, addMember.getMemberId());
        }

        log.info("Enriched add member request with id: {}", addMember.getId());
    }

    public void enrichLeaveOfficeRequest(LeaveOfficeRequest request) {
        LeaveOffice leaveOffice = request.getLeaveOffice();
        RequestInfo requestInfo = request.getRequestInfo();
        String tenantId = leaveOffice.getTenantId();

        leaveOffice.setIsActive(false);

        log.info("Enriched leave office request with id: {}", leaveOffice.getId());
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
