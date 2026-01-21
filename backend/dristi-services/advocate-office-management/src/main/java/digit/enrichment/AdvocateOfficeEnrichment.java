package digit.enrichment;

import digit.web.models.AddMember;
import digit.web.models.AddMemberRequest;
import digit.web.models.LeaveOffice;
import digit.web.models.LeaveOfficeRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class AdvocateOfficeEnrichment {

    public void enrichAddMemberRequest(AddMemberRequest request) {
        AddMember addMember = request.getAddMember();
        addMember.setId(UUID.randomUUID());
        addMember.setAuditDetails(getAuditDetailsForCreate(request.getRequestInfo()));
        log.info("Enriched add member request with id: {}", addMember.getId());
    }

    public void enrichLeaveOfficeRequest(LeaveOfficeRequest request) {
        LeaveOffice leaveOffice = request.getLeaveOffice();
        if (leaveOffice.getId() == null) {
            leaveOffice.setId(UUID.randomUUID());
        }
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

    private AuditDetails getAuditDetailsForUpdate(RequestInfo requestInfo) {
        User user = requestInfo.getUserInfo();
        long currentTime = System.currentTimeMillis();

        return AuditDetails.builder()
                .lastModifiedBy(user.getUuid())
                .lastModifiedTime(currentTime)
                .build();
    }
}
