package digit.validators;

import digit.config.MdmsDataConfig;
import digit.util.InPortalSurveyUtil;
import digit.web.models.EligibilityRequest;
import digit.web.models.FeedBackRequest;
import digit.web.models.RemindMeLaterRequest;
import digit.web.models.SurveyConfig;
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

    private final MdmsDataConfig mdmsDataConfig;

    @Autowired
    public InportalSurveyValidations(InPortalSurveyUtil inPortalSurveyUtil, MdmsDataConfig mdmsDataConfig) {
        this.inPortalSurveyUtil = inPortalSurveyUtil;
        this.mdmsDataConfig = mdmsDataConfig;
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

    public boolean validateEligibility(SurveyTracker surveyTracker, RequestInfo requestInfo) {
        Integer attempts = surveyTracker.getAttempts();
        Long lastTriggeredDate = surveyTracker.getLastTriggeredDate();
        Boolean remindMeLater = surveyTracker.getRemindMeLater();
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();

        SurveyConfig config = mdmsDataConfig.fetchSurveyConfig(requestInfo);
        Integer maxAttempts = config.getMaxNoOfAttempts();

        // Case 1: Never performed any action (remindMeLater or feedback) → eligible
        if (lastTriggeredDate == null) return true;

        if (Boolean.TRUE.equals(remindMeLater)) {
            Long waitPeriod = config.getNoOfDaysForRemindMeLater();
            Long expiryDate = lastTriggeredDate + waitPeriod;

            surveyTracker.setAttempts(attempts + 1);

            // Eligible only if enough time passed AND crossed max attempts
            return (attempts + 1) > maxAttempts && currentTime > expiryDate;
        } else {
            Long waitPeriod = config.getNoOfDaysForExpiryAfterFeedBack();
            Long expiryDate = lastTriggeredDate + waitPeriod;

            // Eligible only if enough time passed since last feedback
            return currentTime > expiryDate;
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
