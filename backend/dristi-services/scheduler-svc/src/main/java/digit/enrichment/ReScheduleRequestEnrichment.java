package digit.enrichment;


import digit.models.coremodels.AuditDetails;
import digit.web.models.ReScheduleHearing;
import digit.web.models.ReScheduleHearingRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;

import java.util.List;

import static digit.config.ServiceConstants.ACTIVE;

@Component
@Slf4j
public class ReScheduleRequestEnrichment {


    public void enrichRescheduleRequest(ReScheduleHearingRequest reScheduleHearingsRequest) {
        log.info("operation = enrichRescheduleRequest , Result = IN_PROGRESS");
        List<ReScheduleHearing> reScheduleHearing = reScheduleHearingsRequest.getReScheduleHearing();
        RequestInfo requestInfo = reScheduleHearingsRequest.getRequestInfo();

        AuditDetails auditDetails = getAuditDetailsReScheduleHearing(requestInfo);

        for (ReScheduleHearing element : reScheduleHearing) {
            element.setRowVersion(1);
            element.setAuditDetails(auditDetails);
            element.setStatus(ACTIVE);
        }
        log.info("operation = enrichRescheduleRequest, Result=SUCCESS");
    }

    private AuditDetails getAuditDetailsReScheduleHearing(RequestInfo requestInfo) {

        return AuditDetails.builder().createdBy(requestInfo.getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(requestInfo.getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();

    }
}
