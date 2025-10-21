package digit.validators;

import digit.config.Configuration;
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
    private Configuration configuration;

    @InjectMocks
    private InportalSurveyValidations validations;

    private RequestInfo requestInfo;
    private User user;

    @BeforeEach
    public void setUp() {
        user = User.builder()
                .uuid("test-user-uuid")
                .userName("testuser")
                .tenantId("pg")
                .build();

        requestInfo = RequestInfo.builder()
                .userInfo(user)
                .build();
    }

    // ==================== validateEligibilityRequest Tests ====================

    @Test
    public void testValidateEligibilityRequest_Success() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        // Act & Assert
        assertDoesNotThrow(() -> validations.validateEligibilityRequest(request));
    }

    @Test
    public void testValidateEligibilityRequest_NullRequest_ThrowsException() {
        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateEligibilityRequest(null);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("Request can not be null", exception.getMessage());
    }

    @Test
    public void testValidateEligibilityRequest_NullRequestInfo_ThrowsException() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(null)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateEligibilityRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("RequestInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateEligibilityRequest_NullUserInfo_ThrowsException() {
        // Arrange
        RequestInfo requestInfoWithoutUser = RequestInfo.builder()
                .userInfo(null)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfoWithoutUser)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateEligibilityRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateEligibilityRequest_NullUserId_ThrowsException() {
        // Arrange
        User userWithoutUuid = User.builder()
                .uuid(null)
                .userName("testuser")
                .build();

        RequestInfo requestInfoWithNullUuid = RequestInfo.builder()
                .userInfo(userWithoutUuid)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfoWithNullUuid)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateEligibilityRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserId can not be null", exception.getMessage());
    }

    // ==================== validateRemindMeLaterRequest Tests ====================

    @Test
    public void testValidateRemindMeLaterRequest_Success() {
        // Arrange
        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        // Act & Assert
        assertDoesNotThrow(() -> validations.validateRemindMeLaterRequest(request));
    }

    @Test
    public void testValidateRemindMeLaterRequest_NullRequest_ThrowsException() {
        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateRemindMeLaterRequest(null);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("Request can not be null", exception.getMessage());
    }

    @Test
    public void testValidateRemindMeLaterRequest_NullRequestInfo_ThrowsException() {
        // Arrange
        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(null)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateRemindMeLaterRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("RequestInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateRemindMeLaterRequest_NullUserInfo_ThrowsException() {
        // Arrange
        RequestInfo requestInfoWithoutUser = RequestInfo.builder()
                .userInfo(null)
                .build();

        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfoWithoutUser)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateRemindMeLaterRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateRemindMeLaterRequest_NullUserId_ThrowsException() {
        // Arrange
        User userWithoutUuid = User.builder()
                .uuid(null)
                .userName("testuser")
                .build();

        RequestInfo requestInfoWithNullUuid = RequestInfo.builder()
                .userInfo(userWithoutUuid)
                .build();

        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfoWithNullUuid)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateRemindMeLaterRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserId can not be null", exception.getMessage());
    }

    // ==================== validateFeedBackRequest Tests ====================

    @Test
    public void testValidateFeedBackRequest_Success() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.VERY_CONVENIENT)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        // Act & Assert
        assertDoesNotThrow(() -> validations.validateFeedBackRequest(request));
    }

    @Test
    public void testValidateFeedBackRequest_NullRequest_ThrowsException() {
        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateFeedBackRequest(null);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("Request can not be null", exception.getMessage());
    }

    @Test
    public void testValidateFeedBackRequest_NullRequestInfo_ThrowsException() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.CONVENIENT)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(null)
                .feedBack(feedBack)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateFeedBackRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("RequestInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateFeedBackRequest_NullUserInfo_ThrowsException() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.MODERATELY_CONVENIENT)
                .build();

        RequestInfo requestInfoWithoutUser = RequestInfo.builder()
                .userInfo(null)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfoWithoutUser)
                .feedBack(feedBack)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateFeedBackRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserInfo can not be null", exception.getMessage());
    }

    @Test
    public void testValidateFeedBackRequest_NullUserId_ThrowsException() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.NEEDS_IMPROVEMENT)
                .build();

        User userWithoutUuid = User.builder()
                .uuid(null)
                .userName("testuser")
                .build();

        RequestInfo requestInfoWithNullUuid = RequestInfo.builder()
                .userInfo(userWithoutUuid)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfoWithNullUuid)
                .feedBack(feedBack)
                .build();

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            validations.validateFeedBackRequest(request);
        });

        assertEquals("Invalid Request: ", exception.getCode());
        assertEquals("UserId can not be null", exception.getMessage());
    }

    // ==================== validateEligibility Tests ====================

    @Test
    public void testValidateEligibility_RemindMeLaterTrue_AttemptsExceeded_ExpiryPassed_ReturnsTrue() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long pastExpiryDate = currentTime - 1000L; // Expired
        Integer maxAttempts = 3;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(3)
                .expiryDate(pastExpiryDate)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(configuration.getMaxNoOfAttempts()).thenReturn(maxAttempts);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertTrue(result);
        assertEquals(4, tracker.getAttempts()); // Incremented
        verify(inPortalSurveyUtil, times(1)).getCurrentTimeInMilliSec();
        verify(configuration, times(1)).getMaxNoOfAttempts();
    }

    @Test
    public void testValidateEligibility_RemindMeLaterTrue_AttemptsNotExceeded_ReturnsFalse() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long futureExpiryDate = currentTime + 10000L; // Not expired
        Integer maxAttempts = 5;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(2)
                .expiryDate(futureExpiryDate)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(configuration.getMaxNoOfAttempts()).thenReturn(maxAttempts);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertFalse(result);
        assertEquals(3, tracker.getAttempts()); // Incremented
    }

    @Test
    public void testValidateEligibility_RemindMeLaterTrue_AttemptsExceeded_ExpiryNotPassed_ReturnsFalse() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long futureExpiryDate = currentTime + 10000L; // Not expired
        Integer maxAttempts = 3;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(3)
                .expiryDate(futureExpiryDate)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(configuration.getMaxNoOfAttempts()).thenReturn(maxAttempts);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertFalse(result);
        assertEquals(4, tracker.getAttempts());
    }

    @Test
    public void testValidateEligibility_RemindMeLaterFalse_NullExpiryDate_ReturnsTrue() {
        // Arrange
        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(0)
                .expiryDate(null)
                .remindMeLater(false)
                .build();

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertTrue(result);
        assertEquals(0, tracker.getAttempts()); // Not incremented
    }

    @Test
    public void testValidateEligibility_RemindMeLaterFalse_ExpiryPassed_ReturnsTrue() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long pastExpiryDate = currentTime - 1000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(0)
                .expiryDate(pastExpiryDate)
                .remindMeLater(false)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertTrue(result);
        assertEquals(0, tracker.getAttempts()); // Not incremented
        verify(inPortalSurveyUtil, times(1)).getCurrentTimeInMilliSec();
    }

    @Test
    public void testValidateEligibility_RemindMeLaterFalse_ExpiryNotPassed_ReturnsFalse() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long futureExpiryDate = currentTime + 10000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(0)
                .expiryDate(futureExpiryDate)
                .remindMeLater(false)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertFalse(result);
        assertEquals(0, tracker.getAttempts());
    }

    @Test
    public void testValidateEligibility_RemindMeLaterNull_ExpiryPassed_ReturnsTrue() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long pastExpiryDate = currentTime - 1000L;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(0)
                .expiryDate(pastExpiryDate)
                .remindMeLater(null)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertTrue(result);
        verify(inPortalSurveyUtil, times(1)).getCurrentTimeInMilliSec();
    }

    @Test
    public void testValidateEligibility_EdgeCase_ExactlyAtExpiry_ReturnsTrue() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long expiryDate = currentTime; // Exactly at expiry

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(0)
                .expiryDate(expiryDate)
                .remindMeLater(false)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertFalse(result); // Equal is not less than, so not expired
    }

    @Test
    public void testValidateEligibility_EdgeCase_AttemptsExactlyAtMax_ReturnsTrue() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long pastExpiryDate = currentTime - 1000L;
        Integer maxAttempts = 3;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(3) // Exactly at max
                .expiryDate(pastExpiryDate)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(configuration.getMaxNoOfAttempts()).thenReturn(maxAttempts);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertTrue(result); // 4 > 3 and expiry passed
        assertEquals(4, tracker.getAttempts());
    }

    @Test
    public void testValidateEligibility_EdgeCase_AttemptsJustBelowMax_ReturnsFalse() {
        // Arrange
        Long currentTime = 1634567890000L;
        Long futureExpiryDate = currentTime + 10000L;
        Integer maxAttempts = 5;

        SurveyTracker tracker = SurveyTracker.builder()
                .attempts(4) // Just below max
                .expiryDate(futureExpiryDate)
                .remindMeLater(true)
                .build();

        when(inPortalSurveyUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(configuration.getMaxNoOfAttempts()).thenReturn(maxAttempts);

        // Act
        boolean result = validations.validateEligibility(tracker);

        // Assert
        assertFalse(result); // 5 is not > 5
        assertEquals(5, tracker.getAttempts());
    }
}
