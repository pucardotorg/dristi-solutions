package digit.enrichment;

import digit.config.Configuration;
import digit.util.InPortalSurveyUtil;
import digit.web.models.*;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InPortalSurveyEnrichmentTest {

    @Mock
    private InPortalSurveyUtil inPortalSurveyUtil;

    @Mock
    private Configuration configuration;

    @InjectMocks
    private InPortalSurveyEnrichment enrichment;

    private RequestInfo requestInfo;
    private User user;
    private Long currentTime;

    @BeforeEach
    public void setUp() {
        currentTime = 1634567890000L;

        user = User.builder()
                .uuid("test-user-uuid")
                .userName("testuser")
                .tenantId("pg")
                .roles(Collections.emptyList())
                .build();

        requestInfo = RequestInfo.builder()
                .userInfo(user)
                .build();

    }

    // ==================== enrichCreateSurveyTracker Tests ====================

    @Test
    public void testEnrichCreateSurveyTracker_WithLitigantRole() {
        // Arrange
        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        // Act
        SurveyTracker result = enrichment.enrichCreateSurveyTracker(request);

        // Assert
        assertNotNull(result);
        assertEquals("test-user-uuid", result.getUserUuid());
        assertEquals("pg", result.getTenantId());
        assertEquals("LITIGANT", result.getUserType());
        assertNotNull(result.getAuditDetails());
        assertEquals("test-user-uuid", result.getAuditDetails().getCreatedBy());
        assertEquals("test-user-uuid", result.getAuditDetails().getLastModifiedBy());

        verify(inPortalSurveyUtil, times(1)).getCurrentTimeInMilliSec();
    }

    @Test
    public void testEnrichCreateSurveyTracker_WithAdvocateRole() {
        // Arrange
        Role advocateRole = Role.builder()
                .code("ADVOCATE_ROLE")
                .name("Advocate")
                .build();

        User advocateUser = User.builder()
                .uuid("advocate-uuid")
                .userName("advocate")
                .tenantId("pg")
                .roles(Collections.singletonList(advocateRole))
                .build();

        RequestInfo advocateRequestInfo = RequestInfo.builder()
                .userInfo(advocateUser)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(advocateRequestInfo)
                .build();

        // Act
        SurveyTracker result = enrichment.enrichCreateSurveyTracker(request);

        // Assert
        assertNotNull(result);
        assertEquals("advocate-uuid", result.getUserUuid());
        assertEquals("ADVOCATE", result.getUserType());
        assertEquals("pg", result.getTenantId());
    }

    @Test
    public void testEnrichCreateSurveyTracker_WithMultipleRoles_AdvocateFirst() {
        // Arrange
        Role advocateRole = Role.builder()
                .code("ADVOCATE_ROLE")
                .name("Advocate")
                .build();

        Role otherRole = Role.builder()
                .code("OTHER_ROLE")
                .name("Other")
                .build();

        User multiRoleUser = User.builder()
                .uuid("multi-role-uuid")
                .userName("multiuser")
                .tenantId("pg")
                .roles(Arrays.asList(advocateRole, otherRole))
                .build();

        RequestInfo multiRoleRequestInfo = RequestInfo.builder()
                .userInfo(multiRoleUser)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(multiRoleRequestInfo)
                .build();

        // Act
        SurveyTracker result = enrichment.enrichCreateSurveyTracker(request);

        // Assert
        assertEquals("ADVOCATE", result.getUserType());
    }

    @Test
    public void testEnrichCreateSurveyTracker_WithCaseInsensitiveAdvocateRole() {
        // Arrange
        Role advocateRole = Role.builder()
                .code("advocate_role") // lowercase
                .name("Advocate")
                .build();

        User advocateUser = User.builder()
                .uuid("advocate-uuid")
                .userName("advocate")
                .tenantId("pg")
                .roles(Collections.singletonList(advocateRole))
                .build();

        RequestInfo advocateRequestInfo = RequestInfo.builder()
                .userInfo(advocateUser)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(advocateRequestInfo)
                .build();

        // Act
        SurveyTracker result = enrichment.enrichCreateSurveyTracker(request);

        // Assert
        assertEquals("ADVOCATE", result.getUserType());
    }

    // ==================== enrichSurveyTrackerForEligibilityCheck Tests ====================

    @Test
    public void testEnrichSurveyTrackerForEligibilityCheck_UpdatesAuditDetails() {
        // Arrange
        AuditDetails existingAuditDetails = AuditDetails.builder()
                .createdBy("original-user")
                .createdTime(1000000L)
                .lastModifiedBy("original-user")
                .lastModifiedTime(1000000L)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .auditDetails(existingAuditDetails)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        // Act
        SurveyTracker result = enrichment.enrichSurveyTrackerForEligibilityCheck(request, existingTracker);

        // Assert
        assertNotNull(result);
        assertEquals("test-user-uuid", result.getAuditDetails().getLastModifiedBy());
        assertEquals("original-user", result.getAuditDetails().getCreatedBy()); // Should not change
        assertEquals(1000000L, result.getAuditDetails().getCreatedTime()); // Should not change

        verify(inPortalSurveyUtil, times(1)).getCurrentTimeInMilliSec();
    }

    @Test
    public void testEnrichSurveyTrackerForEligibilityCheck_NullAuditDetails() {
        // Arrange
        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .auditDetails(null)
                .build();

        EligibilityRequest request = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        // Act
        SurveyTracker result = enrichment.enrichSurveyTrackerForEligibilityCheck(request, existingTracker);

        // Assert
        assertNotNull(result);
        assertNull(result.getAuditDetails());
        verify(inPortalSurveyUtil, never()).getCurrentTimeInMilliSec();
    }

    // ==================== enrichSurveyTrackerForRemindMeLater Tests ====================

    @Test
    public void testEnrichSurveyTrackerForRemindMeLater_Success() {
        // Arrange
        Long noOfDays = 7 * 24 * 60 * 60 * 1000L; // 7 days in milliseconds
        Long expiryTime = currentTime + noOfDays;

        AuditDetails existingAuditDetails = AuditDetails.builder()
                .createdBy("original-user")
                .createdTime(1000000L)
                .lastModifiedBy("original-user")
                .lastModifiedTime(1000000L)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .attempts(3)
                .remindMeLater(false)
                .auditDetails(existingAuditDetails)
                .build();

        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        when(configuration.getNoOfDaysForRemindMeLater()).thenReturn(noOfDays);
        when(inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDays)).thenReturn(expiryTime);

        // Act
        SurveyTracker result = enrichment.enrichSurveyTrackerForRemindMeLater(request, existingTracker);

        // Assert
        assertNotNull(result);
        assertTrue(result.getRemindMeLater());
        assertEquals(expiryTime, result.getExpiryDate());
        assertEquals(0, result.getAttempts());
        assertEquals("test-user-uuid", result.getAuditDetails().getLastModifiedBy());

        verify(configuration, times(1)).getNoOfDaysForRemindMeLater();
        verify(inPortalSurveyUtil, times(1)).getExpiryTimeInMilliSec(noOfDays);
        verify(inPortalSurveyUtil, times(1)).getCurrentTimeInMilliSec();
    }

    @Test
    public void testEnrichSurveyTrackerForRemindMeLater_NullAuditDetails() {
        // Arrange
        Long noOfDays = 7 * 24 * 60 * 60 * 1000L;
        Long expiryTime = currentTime + noOfDays;

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .attempts(5)
                .auditDetails(null)
                .build();

        RemindMeLaterRequest request = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        when(configuration.getNoOfDaysForRemindMeLater()).thenReturn(noOfDays);
        when(inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDays)).thenReturn(expiryTime);

        // Act
        SurveyTracker result = enrichment.enrichSurveyTrackerForRemindMeLater(request, existingTracker);

        // Assert
        assertTrue(result.getRemindMeLater());
        assertEquals(0, result.getAttempts());
        assertEquals(expiryTime, result.getExpiryDate());
    }

    // ==================== enrichSurveyTrackerForFeedBack Tests ====================

    @Test
    public void testEnrichSurveyTrackerForFeedBack_Success() {
        // Arrange
        UUID feedbackUuid = UUID.randomUUID();
        Long noOfDaysForExpiry = 30 * 24 * 60 * 60 * 1000L; // 30 days
        Long expiryTime = currentTime + noOfDaysForExpiry;

        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.VERY_CONVENIENT)
                .feedback("Great service!")
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        AuditDetails trackerAuditDetails = AuditDetails.builder()
                .createdBy("original-user")
                .createdTime(1000000L)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .remindMeLater(true)
                .auditDetails(trackerAuditDetails)
                .build();

        when(inPortalSurveyUtil.generateUUID()).thenReturn(feedbackUuid);
        when(configuration.getNoOfDaysForExpiryAfterFeedBack()).thenReturn(noOfDaysForExpiry);
        when(inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysForExpiry)).thenReturn(expiryTime);

        // Act
        SurveyTracker result = enrichment.enrichSurveyTrackerForFeedBack(request, existingTracker);

        // Assert
        assertNotNull(result);
        assertFalse(result.getRemindMeLater());
        assertEquals(expiryTime, result.getExpiryDate());

        // Check feedback enrichment
        assertEquals(feedbackUuid.toString(), request.getFeedBack().getUuid());
        assertEquals("pg", request.getFeedBack().getTenantId());
        assertNotNull(request.getFeedBack().getAuditDetails());
        assertEquals("test-user-uuid", request.getFeedBack().getAuditDetails().getCreatedBy());

        // Check tracker audit details
        assertEquals("test-user-uuid", result.getAuditDetails().getLastModifiedBy());

        verify(inPortalSurveyUtil, times(1)).generateUUID();
        verify(configuration, times(1)).getNoOfDaysForExpiryAfterFeedBack();
    }

    @Test
    public void testEnrichSurveyTrackerForFeedBack_WithExistingFeedbackAuditDetails() {
        // Arrange
        UUID feedbackUuid = UUID.randomUUID();
        Long noOfDaysForExpiry = 30 * 24 * 60 * 60 * 1000L;
        Long expiryTime = currentTime + noOfDaysForExpiry;

        AuditDetails existingFeedbackAudit = AuditDetails.builder()
                .createdBy("old-user")
                .createdTime(500000L)
                .build();

        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.CONVENIENT)
                .feedback("Good service")
                .auditDetails(existingFeedbackAudit)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .auditDetails(AuditDetails.builder().build())
                .build();

        when(inPortalSurveyUtil.generateUUID()).thenReturn(feedbackUuid);
        when(configuration.getNoOfDaysForExpiryAfterFeedBack()).thenReturn(noOfDaysForExpiry);
        when(inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysForExpiry)).thenReturn(expiryTime);

        // Act
        enrichment.enrichSurveyTrackerForFeedBack(request, existingTracker);

        // Assert
        assertEquals("test-user-uuid", request.getFeedBack().getAuditDetails().getCreatedBy());
    }

    @Test
    public void testEnrichSurveyTrackerForFeedBack_NullTrackerAuditDetails() {
        // Arrange
        UUID feedbackUuid = UUID.randomUUID();
        Long noOfDaysForExpiry = 30 * 24 * 60 * 60 * 1000L;
        Long expiryTime = currentTime + noOfDaysForExpiry;

        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.NEEDS_IMPROVEMENT)
                .build();

        FeedBackRequest request = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        SurveyTracker existingTracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .auditDetails(null)
                .build();

        when(inPortalSurveyUtil.generateUUID()).thenReturn(feedbackUuid);
        when(configuration.getNoOfDaysForExpiryAfterFeedBack()).thenReturn(noOfDaysForExpiry);
        when(inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysForExpiry)).thenReturn(expiryTime);

        // Act
        SurveyTracker result = enrichment.enrichSurveyTrackerForFeedBack(request, existingTracker);

        // Assert
        assertNull(result.getAuditDetails());
        assertNotNull(request.getFeedBack().getAuditDetails());
    }

    @Test
    public void testEnrichSurveyTrackerForFeedBack_AllRatingTypes() {
        // Test with all rating types
        Rating[] ratings = {Rating.VERY_CONVENIENT, Rating.CONVENIENT, Rating.MODERATELY_CONVENIENT, Rating.NEEDS_IMPROVEMENT};

        for (Rating rating : ratings) {
            UUID feedbackUuid = UUID.randomUUID();
            Long noOfDaysForExpiry = 30 * 24 * 60 * 60 * 1000L;
            Long expiryTime = currentTime + noOfDaysForExpiry;

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
                    .auditDetails(AuditDetails.builder().build())
                    .build();

            when(inPortalSurveyUtil.generateUUID()).thenReturn(feedbackUuid);
            when(configuration.getNoOfDaysForExpiryAfterFeedBack()).thenReturn(noOfDaysForExpiry);
            when(inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysForExpiry)).thenReturn(expiryTime);

            SurveyTracker result = enrichment.enrichSurveyTrackerForFeedBack(request, existingTracker);

            assertNotNull(result);
            assertEquals(feedbackUuid.toString(), request.getFeedBack().getUuid());
        }
    }
}
