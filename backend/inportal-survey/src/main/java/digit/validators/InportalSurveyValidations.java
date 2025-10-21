package digit.validators;

import digit.config.Configuration;
import digit.util.InPortalSurveyUtil;
import digit.web.models.EligibilityRequest;
import digit.web.models.FeedBackRequest;
import digit.web.models.RemindMeLaterRequest;
import digit.web.models.SurveyTracker;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class InportalSurveyValidations {

    private final InPortalSurveyUtil inPortalSurveyUtil;

    private final Configuration configuration;

    @Autowired
    public InportalSurveyValidations(InPortalSurveyUtil inPortalSurveyUtil, Configuration configuration) {
        this.inPortalSurveyUtil = inPortalSurveyUtil;
        this.configuration = configuration;
    }

    public void validateEligibilityRequest(EligibilityRequest eligibilityRequest) {

        if (eligibilityRequest == null) {
            throw new CustomException(INVALID_REQUEST, REQUEST_NULL);
        }

        RequestInfo requestInfo = eligibilityRequest.getRequestInfo();

        if (requestInfo == null) {
            throw new CustomException(INVALID_REQUEST, REQUEST_INFO_NULL);
        }

        User userInfo = requestInfo.getUserInfo();

        if (userInfo == null) {
            throw new CustomException(INVALID_REQUEST, USER_INFO_NULL);
        }

        String userId = userInfo.getUuid();

        if (userId == null) {
            throw new CustomException(INVALID_REQUEST, USER_ID_NULL);
        }

    }

    public boolean validateEligibility(SurveyTracker surveyTracker) {

        Integer attempts = surveyTracker.getAttempts();

        Long expiryDate = surveyTracker.getExpiryDate();

        Boolean remindMeLater = surveyTracker.getRemindMeLater();

        Long currentTimeInMilliSec = inPortalSurveyUtil.getCurrentTimeInMilliSec();

        Integer maxNoOfAttempts = configuration.getMaxNoOfAttempts();

        if (remindMeLater != null && remindMeLater) {
            attempts = attempts +1;
            surveyTracker.setAttempts(attempts);
            return attempts > maxNoOfAttempts && expiryDate < currentTimeInMilliSec;
        } else {
            return expiryDate == null || expiryDate < currentTimeInMilliSec;
        }

    }

    public void validateRemindMeLaterRequest(RemindMeLaterRequest request) {

        if (request == null) {
            throw new CustomException(INVALID_REQUEST, REQUEST_NULL);
        }

        RequestInfo requestInfo = request.getRequestInfo();

        if (requestInfo == null) {
            throw new CustomException(INVALID_REQUEST, REQUEST_INFO_NULL);
        }

        User userInfo = requestInfo.getUserInfo();

        if (userInfo == null) {
            throw new CustomException(INVALID_REQUEST, USER_INFO_NULL);
        }

        String userId = userInfo.getUuid();

        if (userId == null) {
            throw new CustomException(INVALID_REQUEST, USER_ID_NULL);
        }

    }

    public void validateFeedBackRequest(FeedBackRequest request) {

        if (request == null) {
            throw new CustomException(INVALID_REQUEST, REQUEST_NULL);
        }

        RequestInfo requestInfo = request.getRequestInfo();

        if (requestInfo == null) {
            throw new CustomException(INVALID_REQUEST, REQUEST_INFO_NULL);
        }

        User userInfo = requestInfo.getUserInfo();

        if (userInfo == null) {
            throw new CustomException(INVALID_REQUEST, USER_INFO_NULL);
        }

        String userId = userInfo.getUuid();

        if (userId == null) {
            throw new CustomException(INVALID_REQUEST, USER_ID_NULL);
        }

    }

}
