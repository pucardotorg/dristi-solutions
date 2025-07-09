package org.pucar.dristi.validators;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNoticeRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

@Component
@Slf4j
public class LandingPageNoticeValidator {

    public void validateSaveDiaryEntry(LandingPageNoticeRequest landingPageNoticeRequest) {

        LandingPageNotice landingPageNotice = landingPageNoticeRequest.getLandingPageNotice();

        RequestInfo requestInfo = landingPageNoticeRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(landingPageNotice)) {
            throw new CustomException("VALIDATION_EXCEPTION", "case diary entry is mandatory to create an entry");
        }
        if (requestInfo == null || requestInfo.getUserInfo() == null) {
            throw new CustomException("VALIDATION_EXCEPTION", "request Info or user info can not be null");
        }

        if (!requestInfo.getUserInfo().getType().equals("EMPLOYEE")) {
            throw new CustomException("VALIDATION_EXCEPTION", "user must be employee");
        }
    }

}
