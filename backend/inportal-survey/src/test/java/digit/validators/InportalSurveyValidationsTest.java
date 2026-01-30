package digit.validators;

import digit.config.MdmsDataConfig;
import digit.util.InPortalSurveyUtil;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InportalSurveyValidationsTest {

    @Mock
    private InPortalSurveyUtil inPortalSurveyUtil;

    @Mock
    private MdmsDataConfig mdmsDataConfig;

    @InjectMocks
    private InportalSurveyValidations validations;

    private RequestInfo requestInfo;
    private SurveyConfig surveyConfig;

    @BeforeEach
    public void setUp() {
        User user = User.builder()
                .uuid("test-user-uuid")
                .userName("testuser")
                .tenantId("pg")
                .build();

        requestInfo = RequestInfo.builder()
                .userInfo(user)
                .build();

        surveyConfig = SurveyConfig.builder()
                .id(1)
                .noOfDaysForExpiryAfterFeedBack(5184000000L)
                .noOfDaysForRemindMeLater(172800000L)
                .maxNoOfAttempts(3)
                .build();
    }

    // ==================== validateEligibilityRequest Tests ====================

    @Test
    public void testValidateEligibilityRequest_Success() {
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        assertDoesNotThrow(() -> validations.validateEligibilityRequest(request));
    }

    @Test
    public void testValidateEligibilityRequest_NullRequest_ThrowsException() {
        CustomException exception = assertThrows(CustomException.class,
                () -> validations.validateEligibilityRequest(null));

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("Request can not be null", exception.getMessage());
    }

    @Test
    public void testValidateEligibilityRequest_NullRequestInfo_ThrowsException() {
        EligibilityRequest request = EligibilityRequest.builder().requestInfo(null).build();

        CustomException exception = assertThrows(CustomException.class,
                () -> validations.validateEligibilityRequest(request));

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("RequestInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateEligibilityRequest_NullUserInfo_ThrowsException() {
        RequestInfo noUserInfo = RequestInfo.builder().userInfo(null).build();
        EligibilityRequest request = EligibilityRequest.builder().requestInfo(noUserInfo).build();

        CustomException exception = assertThrows(CustomException.class,
                () -> validations.validateEligibilityRequest(request));

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateEligibilityRequest_NullUserId_ThrowsException() {
        User userWithoutUuid = User.builder().uuid(null).userName("testuser").build();
        RequestInfo info = RequestInfo.builder().userInfo(userWithoutUuid).build();
        EligibilityRequest request = EligibilityRequest.builder().requestInfo(info).build();

        CustomException exception = assertThrows(CustomException.class,
                () -> validations.validateEligibilityRequest(request));

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserId can not be null", exception.getMessage());
    }

    // ==================== validateEligibility Tests ====================

    @Test
    public void testValidateEligibility_FirstTimeUser_ReturnsTrue() {
        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(0)
                .lastTriggeredDate(null)
                .remindMeLater(false)
                .build();

        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);
        assertTrue(result);
    }

    @Test
    public void testValidateEligibility_RemindMeLater_ExceededMaxAttempts_AndExpired_ReturnsTrue() {
        Long currentTime = 172802000L;
        Long lastTriggered = 1000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(3)
                .lastTriggeredDate(lastTriggered)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);

        assertTrue(result);
        assertEquals(4, tracker.getAttempts());
    }

    @Test
    public void testValidateEligibility_RemindMeLater_NotExceededMaxAttempts_ReturnsFalse() {
        Long currentTime = 20000L;
        Long lastTriggered = 1000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(1)
                .lastTriggeredDate(lastTriggered)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);

        // (attempts+1)=2, maxAttempts=3 → 2>3? false
        assertFalse(result);
        assertEquals(2, tracker.getAttempts());
    }

    @Test
    public void testValidateEligibility_RemindMeLater_ExceededMaxAttempts_ButNotExpired_ReturnsFalse() {
        long currentTime = 10000L;
        Long lastTriggered = currentTime + 9999999L; // not expired

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(3)
                .lastTriggeredDate(lastTriggered)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);

        assertFalse(result);
        assertEquals(4, tracker.getAttempts());
    }

    @Test
    public void testValidateEligibility_FeedbackExpired_ReturnsTrue() {
        Long currentTime = System.currentTimeMillis();
        Long lastTriggered = 1000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(1)
                .lastTriggeredDate(lastTriggered)
                .remindMeLater(false)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);

        assertTrue(result);
    }

    @Test
    public void testValidateEligibility_FeedbackNotExpired_ReturnsFalse() {
        Long currentTime = 1000L;
        Long lastTriggered = 9000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(1)
                .lastTriggeredDate(lastTriggered)
                .remindMeLater(false)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);

        assertFalse(result);
    }

    @Test
    public void testValidateEligibility_RemindMeLaterNull_BehavesAsFeedbackBranch() {
        Long currentTime = 20000L;
        Long lastTriggered = 1000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(2)
                .lastTriggeredDate(lastTriggered)
                .remindMeLater(null)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(mdmsDataConfig.fetchSurveyConfig(requestInfo)).thenReturn(surveyConfig);

        boolean result = validations.validateEligibility(tracker, requestInfo);

        assertFalse(result);
    }
}