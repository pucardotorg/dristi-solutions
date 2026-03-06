package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.CtcApplication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class CtcApplicationEnrichment {

    private final Configuration config;
    private final IdgenUtil idgenUtil;

    @Autowired
    public CtcApplicationEnrichment(Configuration config, IdgenUtil idgenUtil) {
        this.config = config;
        this.idgenUtil = idgenUtil;
    }

    public void enrichOnCreateCtcApplication(RequestInfo requestInfo, CtcApplication ctcApplication) {
        ctcApplication.setCtcApplicationNumber(generateApplicationNumber(ctcApplication.getTenantId(), requestInfo));
        enrichAuditDetailsOnCreate(requestInfo, ctcApplication);
        ctcApplication.setId(getRandomUuid().toString());
    }

    public void enrichOnUpdateCtcApplication(RequestInfo requestInfo, CtcApplication ctcApplication) {
        enrichAuditDetailsOnUpdate(requestInfo, ctcApplication);
    }

    private String generateApplicationNumber(String tenantId, RequestInfo requestInfo) {
        try {
            String year = getCurrentYearAsString();
            tenantId = tenantId + year;
            String idName = config.getCaConfig();
            String idFormat = config.getCaFormat();
            List<String> cmpNumberIdList = idgenUtil.getIdList(requestInfo, tenantId, idName, idFormat, 1, false);

            return cmpNumberIdList.get(0) + "/" + year;
        } catch (Exception e) {
            log.error("Error enriching ca number: {}", e.toString());
            throw new CustomException("ENRICHMENT_EXCEPTION", "Error while enriching ca number: " + e.getMessage());
        }
    }

    public void enrichAuditDetailsOnCreate(RequestInfo requestInfo, CtcApplication ctcApplication) {

        long currentTime = System.currentTimeMillis();

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(requestInfo.getUserInfo().getUuid())
                .createdTime(currentTime)
                .lastModifiedBy(requestInfo.getUserInfo().getUuid())
                .lastModifiedTime(currentTime)
                .build();

        ctcApplication.setAuditDetails(auditDetails);
    }

    public void enrichAuditDetailsOnUpdate(RequestInfo requestInfo, CtcApplication ctcApplication) {
        AuditDetails auditDetails = ctcApplication.getAuditDetails();
        if (auditDetails != null) {
            auditDetails.setLastModifiedBy(requestInfo.getUserInfo().getUuid());
            auditDetails.setLastModifiedTime(System.currentTimeMillis());
            ctcApplication.setAuditDetails(auditDetails);
        }
    }

    private String getCurrentYearAsString() {
        LocalDate currentDate = LocalDate.now(ZoneId.of(config.getZoneId()));
        return String.valueOf(currentDate.getYear());
    }


    public UUID getRandomUuid() {
        return UUID.randomUUID();
    }

}
