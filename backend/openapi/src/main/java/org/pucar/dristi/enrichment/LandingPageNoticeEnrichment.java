package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.util.LandingPageNoticeUtil;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNoticeRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class LandingPageNoticeEnrichment {

    private final LandingPageNoticeUtil landingPageNoticeUtil;

    @Autowired
    public LandingPageNoticeEnrichment(LandingPageNoticeUtil landingPageNoticeUtil) {
        this.landingPageNoticeUtil = landingPageNoticeUtil;
    }

    public void enrichCreateNotice(LandingPageNoticeRequest landingPageNoticeRequest) {

        log.info("operation = enrichCreateNotice ,  result = IN_PROGRESS , LandingPageNoticeRequest : {} ", landingPageNoticeRequest);

        try {

            LandingPageNotice landingPageNotice = landingPageNoticeRequest.getLandingPageNotice();
            RequestInfo requestInfo = landingPageNoticeRequest.getRequestInfo();
            User user = requestInfo.getUserInfo();

            landingPageNotice.setCreatedBy(user.getUuid());
            landingPageNotice.setNoticeNumber(landingPageNoticeUtil.getNoticeNumber());
            landingPageNotice.setCreatedTime(landingPageNoticeUtil.getCurrentTimeInMilliSec());
            landingPageNotice.setLastModifiedBy(user.getUuid());
            landingPageNotice.setLastModifiedTime(landingPageNoticeUtil.getCurrentTimeInMilliSec());

        } catch (CustomException e) {
            log.error("Error occurred while enriching landing page notice: {}", e.getMessage(), e);
            throw new CustomException("ENRICHMENT_EXCEPTION", "Error during enriching landing page notice");
        }

        log.info("operation = enrichCreateNotice ,  result = SUCCESS , landingPageNoticeRequest : {} ", landingPageNoticeRequest);

    }

    public void enrichUpdateNotice(LandingPageNoticeRequest landingPageNoticeRequest) {

        LandingPageNotice landingPageNotice = landingPageNoticeRequest.getLandingPageNotice();
        RequestInfo requestInfo = landingPageNoticeRequest.getRequestInfo();
        User user = requestInfo.getUserInfo();

        landingPageNotice.setLastModifiedBy(user.getUuid());
        landingPageNotice.setLastModifiedTime(landingPageNoticeUtil.getCurrentTimeInMilliSec());

    }

}
