package digit.service;

import digit.config.Configuration;
import digit.enrichment.InPortalSurveyEnrichment;
import digit.kafka.Producer;
import digit.repository.InPortalSurveyRepository;
import digit.validators.InportalSurveyValidations;
import digit.web.models.*;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static digit.config.ServiceConstants.ELIGIBILITY_CHECK_EXCEPTION;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InPortalSurveyServiceTest {

    @Mock
    private InportalSurveyValidations validations;

    @Mock
    private InPortalSurveyRepository repository;

    @Mock
    private InPortalSurveyEnrichment enrichment;

    @Mock
    private Configuration config;

    @Mock
    private Producer producer;

    @InjectMocks
    private InPortalSurveyService inPortalSurveyService;

    private RequestInfo requestInfo;

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
    }

    // ==================== checkEligibility Tests ====================

    @Test
    public void testCheckEligibility_NoExistingTracker_CreatesNewTracker() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        SurveyTracker newTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.emptyList());
        when(enrichment.enrichCreateSurveyTracker(any(EligibilityRequest.class)))
                .thenReturn(newTracker);
        when(config.getCreateSurveyTrackerTopic()).thenReturn("create-survey-tracker");
        doNothing().when(validations).validateEligibilityRequest(any(EligibilityRequest.class));

        // Act
        Eligibility result = inPortalSurveyService.checkEligibility(request);

        // Assert
        assertNotNull(result);
        assertTrue(result.getIsEligible());
        verify(validations, times(1)).validateEligibilityRequest(request);
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, times(1)).enrichCreateSurveyTracker(request);
        verify(producer, times(1)).push(eq("create-survey-tracker"), any(SurveyTrackerRequest.class));
        verify(validations, never()).validateEligibility(any(SurveyTracker.class), any(RequestInfo.class));
    }

    @Test
    public void testCheckEligibility_ExistingTracker_Eligible() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .attempts(0)
                .auditDetails(AuditDetails.builder().build())
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.singletonList(existingTracker));
        when(enrichment.enrichSurveyTrackerForEligibilityCheck(any(EligibilityRequest.class), any(SurveyTracker.class)))
                .thenReturn(existingTracker);
        when(validations.validateEligibility(any(SurveyTracker.class), any(RequestInfo.class)))
                .thenReturn(true);
        when(config.getUpdateSurveyTrackerTopic()).thenReturn("update-survey-tracker");
        doNothing().when(validations).validateEligibilityRequest(any(EligibilityRequest.class));

        // Act
        Eligibility result = inPortalSurveyService.checkEligibility(request);

        // Assert
        assertNotNull(result);
        assertTrue(result.getIsEligible());
        verify(validations, times(1)).validateEligibilityRequest(request);
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, times(1)).enrichSurveyTrackerForEligibilityCheck(request, existingTracker);
        verify(validations, times(1)).validateEligibility(existingTracker, requestInfo);
        verify(producer, times(1)).push(eq("update-survey-tracker"), any(SurveyTrackerRequest.class));
    }

    @Test
    public void testCheckEligibility_ExistingTracker_NotEligible() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .attempts(5)
                .auditDetails(AuditDetails.builder().build())
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.singletonList(existingTracker));
        when(enrichment.enrichSurveyTrackerForEligibilityCheck(any(EligibilityRequest.class), any(SurveyTracker.class)))
                .thenReturn(existingTracker);
        when(validations.validateEligibility(any(SurveyTracker.class), any(RequestInfo.class)))
                .thenReturn(false);
        when(config.getUpdateSurveyTrackerTopic()).thenReturn("update-survey-tracker");
        doNothing().when(validations).validateEligibilityRequest(any(EligibilityRequest.class));

        // Act
        Eligibility result = inPortalSurveyService.checkEligibility(request);

        // Assert
        assertNotNull(result);
        assertFalse(result.getIsEligible());
        verify(validations, times(1)).validateEligibility(existingTracker, requestInfo);
        verify(producer, times(1)).push(eq("update-survey-tracker"), any(SurveyTrackerRequest.class));
    }

    @Test
    public void testCheckEligibility_MultipleTrackers_ThrowsException() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        SurveyTracker tracker1 = SurveyTracker.builder().userUuid("test-user-uuid").build();
        SurveyTracker tracker2 = SurveyTracker.builder().userUuid("test-user-uuid").build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Arrays.asList(tracker1, tracker2));
        doNothing().when(validations).validateEligibilityRequest(any(EligibilityRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.checkEligibility(request));

        assertEquals(ELIGIBILITY_CHECK_EXCEPTION, exception.getCode());
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, never()).enrichSurveyTrackerForEligibilityCheck(any(), any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    public void testCheckEligibility_ValidationThrowsException_WrapsException() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed"))
                .when(validations).validateEligibilityRequest(any(EligibilityRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.checkEligibility(request));

        assertEquals(ELIGIBILITY_CHECK_EXCEPTION, exception.getCode());
        verify(validations, times(1)).validateEligibilityRequest(request);
        verify(repository, never()).getSurveyTracker(any());
    }

    // ==================== createRemindMeLater Tests ====================

    @Test
    public void testCreateRemindMeLater_Success() {
        // Arrange
        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .auditDetails(AuditDetails.builder().build())
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.singletonList(existingTracker));
        when(enrichment.enrichSurveyTrackerForRemindMeLater(any(RemindMeLaterRequest.class), any(SurveyTracker.class)))
                .thenReturn(existingTracker);
        when(config.getUpdateExpiryDateTopic()).thenReturn("update-expiry-date");
        doNothing().when(validations).validateRemindMeLaterRequest(any(RemindMeLaterRequest.class));

        // Act
        inPortalSurveyService.createRemindMeLater(request);

        // Assert
        verify(validations, times(1)).validateRemindMeLaterRequest(request);
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, times(1)).enrichSurveyTrackerForRemindMeLater(request, existingTracker);
        verify(producer, times(1)).push(eq("update-expiry-date"), any(SurveyTrackerRequest.class));
    }

    @Test
    public void testCreateRemindMeLater_NoExistingTracker_ThrowsException() {
        // Arrange
        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.emptyList());
        doNothing().when(validations).validateRemindMeLaterRequest(any(RemindMeLaterRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.createRemindMeLater(request));

        assertEquals("REMIND_ME_LATER_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("No existing survey tracker found"));
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, never()).enrichSurveyTrackerForRemindMeLater(any(), any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    public void testCreateRemindMeLater_MultipleTrackers_ThrowsException() {
        // Arrange
        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        SurveyTracker tracker1 = SurveyTracker.builder().userUuid("test-user-uuid").build();
        SurveyTracker tracker2 = SurveyTracker.builder().userUuid("test-user-uuid").build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Arrays.asList(tracker1, tracker2));
        doNothing().when(validations).validateRemindMeLaterRequest(any(RemindMeLaterRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.createRemindMeLater(request));

        assertEquals("REMIND_ME_LATER_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Multiple survey trackers found"));
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    public void testCreateRemindMeLater_ValidationFails_ThrowsException() {
        // Arrange
        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed"))
                .when(validations).validateRemindMeLaterRequest(any(RemindMeLaterRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.createRemindMeLater(request));

        assertEquals("REMIND_ME_LATER_EXCEPTION", exception.getCode());
        verify(validations, times(1)).validateRemindMeLaterRequest(request);
        verify(repository, never()).getSurveyTracker(any());
    }

    // ==================== createFeedBack Tests ====================

    @Test
    public void testCreateFeedBack_Success() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.VERY_CONVENIENT)
                .feedback("Great service!")
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .auditDetails(AuditDetails.builder().build())
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.singletonList(existingTracker));
        when(enrichment.enrichSurveyTrackerForFeedBack(any(FeedBackRequest.class), any(SurveyTracker.class)))
                .thenReturn(existingTracker);
        when(config.getUpdateExpiryDateTopic()).thenReturn("update-expiry-date");
        when(config.getCreateFeedBackTopic()).thenReturn("create-feedback");
        doNothing().when(validations).validateFeedBackRequest(any(FeedBackRequest.class));

        // Act
        FeedBack result = inPortalSurveyService.createFeedBack(request);

        // Assert
        assertNotNull(result);
        assertEquals(feedBack, result);
        verify(validations, times(1)).validateFeedBackRequest(request);
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, times(1)).enrichSurveyTrackerForFeedBack(request, existingTracker);
        verify(producer, times(1)).push(eq("update-expiry-date"), any(SurveyTrackerRequest.class));
    }

    @Test
    public void testCreateFeedBack_NoExistingTracker_ThrowsException() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.CONVENIENT)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Collections.emptyList());
        doNothing().when(validations).validateFeedBackRequest(any(FeedBackRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.createFeedBack(request));

        assertEquals("FEED_BACK_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("No existing survey tracker found"));
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(enrichment, never()).enrichSurveyTrackerForFeedBack(any(), any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    public void testCreateFeedBack_MultipleTrackers_ThrowsException() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.NEEDS_IMPROVEMENT)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        SurveyTracker tracker1 = SurveyTracker.builder().userUuid("test-user-uuid").build();
        SurveyTracker tracker2 = SurveyTracker.builder().userUuid("test-user-uuid").build();

        when(repository.getSurveyTracker(any(RequestInfo.class)))
                .thenReturn(Arrays.asList(tracker1, tracker2));
        doNothing().when(validations).validateFeedBackRequest(any(FeedBackRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.createFeedBack(request));

        assertEquals("FEED_BACK_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Multiple survey trackers found"));
        verify(repository, times(1)).getSurveyTracker(requestInfo);
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    public void testCreateFeedBack_ValidationFails_ThrowsException() {
        // Arrange
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.MODERATELY_CONVENIENT)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed"))
                .when(validations).validateFeedBackRequest(any(FeedBackRequest.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> inPortalSurveyService.createFeedBack(request));

        assertEquals("FEED_BACK_EXCEPTION", exception.getCode());
        verify(validations, times(1)).validateFeedBackRequest(request);
        verify(repository, never()).getSurveyTracker(any());
    }

    @Test
    public void testCreateFeedBack_WithAllRatingTypes() {
        // Test with all rating types to ensure coverage
        Rating[] ratings = {Rating.VERY_CONVENIENT, Rating.CONVENIENT, Rating.MODERATELY_CONVENIENT, Rating.NEEDS_IMPROVEMENT};

        for (Rating rating : ratings) {
            FeedBack feedBack = FeedBack.builder()
                    .rating(rating)
                    .feedback("Feedback for " + rating)
                    .build();

            FeedBackRequest request = FeedBackRequest.builder()
                    .requestInfo(requestInfo)
                    .feedBack(feedBack)
                    .build();

            SurveyTracker existingTracker = SurveyTracker.builder()
                    .userUuid("test-user-uuid")
                    .tenantId("pg")
                    .auditDetails(AuditDetails.builder().build())
                    .build();

            when(repository.getSurveyTracker(any(RequestInfo.class)))
                    .thenReturn(Collections.singletonList(existingTracker));
            when(enrichment.enrichSurveyTrackerForFeedBack(any(FeedBackRequest.class), any(SurveyTracker.class)))
                    .thenReturn(existingTracker);
            when(config.getUpdateExpiryDateTopic()).thenReturn("update-expiry-date");
            when(config.getCreateFeedBackTopic()).thenReturn("create-feedback");
            doNothing().when(validations).validateFeedBackRequest(any(FeedBackRequest.class));

            FeedBack result = inPortalSurveyService.createFeedBack(request);

            assertNotNull(result);
            assertEquals(rating, result.getRating());
        }
    }
}
