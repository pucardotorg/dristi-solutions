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

    public void validateNoticeCreate(LandingPageNoticeRequest landingPageNoticeRequest) {

        LandingPageNotice landingPageNotice = landingPageNoticeRequest.getLandingPageNotice();

        RequestInfo requestInfo = landingPageNoticeRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(landingPageNotice)) {
            throw new CustomException("VALIDATION_EXCEPTION", "landingPageNotice can not be null");
        }
        if (requestInfo == null || requestInfo.getUserInfo() == null) {
            throw new CustomException("VALIDATION_EXCEPTION", "request Info or user info can not be null");
        }

        if (!requestInfo.getUserInfo().getType().equals("EMPLOYEE")) {
            throw new CustomException("VALIDATION_EXCEPTION", "user must be employee");
        }
    }

    public void validateNoticeUpdate(LandingPageNoticeRequest landingPageNoticeRequest) {
        LandingPageNotice landingPageNotice = landingPageNoticeRequest.getLandingPageNotice();

        RequestInfo requestInfo = landingPageNoticeRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(landingPageNotice)) {
            throw new CustomException("VALIDATION_EXCEPTION", "landingPageNotice can not be null");
        }

        if (requestInfo == null || requestInfo.getUserInfo() == null) {
            throw new CustomException("VALIDATION_EXCEPTION", "request Info or user info can not be null");
        }

        if (!requestInfo.getUserInfo().getType().equals("EMPLOYEE")) {
            throw new CustomException("VALIDATION_EXCEPTION", "user must be employee");
        }

        if (ObjectUtils.isEmpty(landingPageNotice.getId())) {
            throw new CustomException("VALIDATION_EXCEPTION", "id can not be null");
        }
    }

}
