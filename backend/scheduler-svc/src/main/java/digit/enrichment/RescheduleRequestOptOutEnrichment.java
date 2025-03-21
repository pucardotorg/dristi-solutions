package digit.enrichment;


import digit.models.coremodels.AuditDetails;
import digit.web.models.OptOutRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class RescheduleRequestOptOutEnrichment {

    public void enrichCreateRequest(OptOutRequest request) {
        log.info("operation = enrichCreateRequest, result = IN_PROGRESS, OptOut = {}", request.getOptOut());
        AuditDetails auditDetails = getAuditDetailsScheduleHearing(request.getRequestInfo());
        request.getOptOut().setId(UUID.randomUUID().toString());
        request.getOptOut().setAuditDetails(auditDetails);
        request.getOptOut().setRowVersion(1);
        log.info("operation = enrichCreateRequest, result = SUCCESS, OptOut = {}", request.getOptOut());

    }


    private AuditDetails getAuditDetailsScheduleHearing(RequestInfo requestInfo) {

        return AuditDetails.builder()
                .createdBy(requestInfo.getUserInfo().getUuid())
                .createdTime(System.currentTimeMillis())
                .lastModifiedBy(requestInfo.getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis())
                .build();

    }
}
