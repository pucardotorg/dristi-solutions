package digit.enrichment;

import digit.config.Configuration;
import digit.util.InPortalSurveyUtil;
import digit.web.models.EligibilityRequest;
import digit.web.models.FeedBackRequest;
import digit.web.models.RemindMeLaterRequest;
import digit.web.models.SurveyTracker;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class InPortalSurveyEnrichment {

    private final InPortalSurveyUtil inPortalSurveyUtil;

    @Autowired
    public InPortalSurveyEnrichment(InPortalSurveyUtil inPortalSurveyUtil) {
        this.inPortalSurveyUtil = inPortalSurveyUtil;
    }

    public SurveyTracker enrichCreateSurveyTracker(EligibilityRequest eligibilityRequest) {

        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        String userUuid = eligibilityRequest.getRequestInfo().getUserInfo().getUuid();

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(userUuid)
                .createdTime(currentTime)
                .lastModifiedBy(userUuid)
                .lastModifiedTime(currentTime)
                .build();

        return SurveyTracker.builder()
                .userUuid(userUuid)
                .userType(getUserType(eligibilityRequest.getRequestInfo()))
                .tenantId(eligibilityRequest.getRequestInfo().getUserInfo().getTenantId())
                .auditDetails(auditDetails)
                .build();

    }

    public SurveyTracker enrichSurveyTrackerForEligibilityCheck(EligibilityRequest eligibilityRequest, SurveyTracker surveyTracker) {

        AuditDetails auditDetails = surveyTracker.getAuditDetails();
        if (auditDetails != null) {
            auditDetails.setLastModifiedBy(eligibilityRequest.getRequestInfo().getUserInfo().getUuid());
            auditDetails.setLastModifiedTime(inPortalSurveyUtil.getCurrentTimeInMilliSec());
        }
        
        return surveyTracker;

    }

    public SurveyTracker enrichSurveyTrackerForRemindMeLater(RemindMeLaterRequest request, SurveyTracker surveyTracker) {

        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();

        surveyTracker.setRemindMeLater(true);
        surveyTracker.setLastTriggeredDate(currentTime);
        surveyTracker.setAttempts(0);
        
        AuditDetails auditDetails = surveyTracker.getAuditDetails();
        if (auditDetails != null) {
            auditDetails.setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
            auditDetails.setLastModifiedTime(inPortalSurveyUtil.getCurrentTimeInMilliSec());
        }
        
        return surveyTracker;

    }

    public SurveyTracker enrichSurveyTrackerForFeedBack(FeedBackRequest request, SurveyTracker surveyTracker) {

        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        String userUuid = request.getRequestInfo().getUserInfo().getUuid();

        request.getFeedBack().setUuid(inPortalSurveyUtil.generateUUID().toString());
        request.getFeedBack().setTenantId(request.getRequestInfo().getUserInfo().getTenantId());

        // Set feedback audit details
        AuditDetails feedbackAuditDetails = request.getFeedBack().getAuditDetails();
        if (feedbackAuditDetails == null) {
            feedbackAuditDetails = new AuditDetails();
        }
        feedbackAuditDetails.setCreatedTime(currentTime);
        feedbackAuditDetails.setCreatedBy(userUuid);
        feedbackAuditDetails.setLastModifiedBy(userUuid);
        feedbackAuditDetails.setLastModifiedTime(currentTime);
        request.getFeedBack().setAuditDetails(feedbackAuditDetails);

        // Update surveyTracker audit details
        AuditDetails surveyTrackerAuditDetails = surveyTracker.getAuditDetails();
        if (surveyTrackerAuditDetails != null) {
            surveyTrackerAuditDetails.setLastModifiedBy(userUuid);
            surveyTrackerAuditDetails.setLastModifiedTime(currentTime);
        }

        // update remind me later
        surveyTracker.setRemindMeLater(false);

        // update last triggered date to current time
        surveyTracker.setLastTriggeredDate(currentTime);

        return surveyTracker;
    }


    private String getUserType(RequestInfo requestInfo) {
        List<Role> roles = requestInfo.getUserInfo().getRoles();
        for (Role role : roles) {
            if (ADVOCATE_ROLE.equalsIgnoreCase(role.getCode())) {
                return ADVOCATE;
            }
        }
        return LITIGANT;
    }

}
