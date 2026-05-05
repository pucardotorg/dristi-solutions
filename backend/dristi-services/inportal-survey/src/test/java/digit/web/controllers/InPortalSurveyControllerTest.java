package digit.web.controllers;

import digit.service.InPortalSurveyService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InPortalSurveyControllerTest {

    @Mock
    private InPortalSurveyService inPortalSurveyService;

    @Mock
    private ResponseInfoFactory responseInfoFactory;

    @InjectMocks
    private InPortalSurveyController inPortalSurveyController;

    private RequestInfo requestInfo;
    private ResponseInfo responseInfo;

    @BeforeEach
    public void setUp() {
        // Setup common test data
        User user = User.builder()
                .uuid("test-user-uuid")
                .userName("testuser")
                .build();

        requestInfo = RequestInfo.builder()
                .userInfo(user)
                .build();

        responseInfo = ResponseInfo.builder()
                .status("successful")
                .build();
    }

    // ==================== Eligibility Endpoint Tests ====================

    @Test
    public void testCreateEligibility_Success_Eligible() {
        // Arrange
        EligibilityRequest eligibilityRequest = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        Eligibility eligibility = Eligibility.builder()
                .isEligible(true)
                .build();

        when(inPortalSurveyService.checkEligibility(any(EligibilityRequest.class)))
                .thenReturn(eligibility);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<EligibilityResponse> response = inPortalSurveyController.createEligibility(eligibilityRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().getEligibility().getIsEligible());
        assertEquals(responseInfo, response.getBody().getResponseInfo());

        verify(inPortalSurveyService, times(1)).checkEligibility(eligibilityRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    public void testCreateEligibility_Success_NotEligible() {
        // Arrange
        EligibilityRequest eligibilityRequest = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        Eligibility eligibility = Eligibility.builder()
                .isEligible(false)
                .build();

        when(inPortalSurveyService.checkEligibility(any(EligibilityRequest.class)))
                .thenReturn(eligibility);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<EligibilityResponse> response = inPortalSurveyController.createEligibility(eligibilityRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(false, response.getBody().getEligibility().getIsEligible());
        assertEquals(responseInfo, response.getBody().getResponseInfo());

        verify(inPortalSurveyService, times(1)).checkEligibility(eligibilityRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    // ==================== FeedBack Endpoint Tests ====================

    @Test
    public void testCreateFeedBack_Success() {
        // Arrange
        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy("test-user")
                .createdTime(System.currentTimeMillis())
                .build();

        FeedBack feedBack = FeedBack.builder()
                .uuid("feedback-uuid")
                .tenantId("pg")
                .rating(Rating.VERY_CONVENIENT)
                .feedback("Great service!")
                .category("general")
                .auditDetails(auditDetails)
                .build();

        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(feedBack);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<FeedBackResponse> response = inPortalSurveyController.createFeedBack(feedBackRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(feedBack, response.getBody().getFeedback());
        assertEquals(responseInfo, response.getBody().getResponseInfo());
        assertEquals("feedback-uuid", response.getBody().getFeedback().getUuid());
        assertEquals(Rating.VERY_CONVENIENT, response.getBody().getFeedback().getRating());

        verify(inPortalSurveyService, times(1)).createFeedBack(feedBackRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    public void testCreateFeedBack_Success_WithDifferentRatings() {
        // Test with CONVENIENT rating
        FeedBack feedBack = FeedBack.builder()
                .uuid("feedback-uuid-2")
                .tenantId("pg")
                .rating(Rating.CONVENIENT)
                .feedback("Good service")
                .build();

        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(feedBack);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<FeedBackResponse> response = inPortalSurveyController.createFeedBack(feedBackRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(Rating.CONVENIENT, response.getBody().getFeedback().getRating());

        verify(inPortalSurveyService, times(1)).createFeedBack(feedBackRequest);
    }

    @Test
    public void testCreateFeedBack_Success_WithModerateRating() {
        // Test with MODERATELY_CONVENIENT rating
        FeedBack feedBack = FeedBack.builder()
                .uuid("feedback-uuid-3")
                .tenantId("pg")
                .rating(Rating.MODERATELY_CONVENIENT)
                .feedback("Average service")
                .build();

        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(feedBack);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<FeedBackResponse> response = inPortalSurveyController.createFeedBack(feedBackRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(Rating.MODERATELY_CONVENIENT, response.getBody().getFeedback().getRating());

        verify(inPortalSurveyService, times(1)).createFeedBack(feedBackRequest);
    }

    @Test
    public void testCreateFeedBack_Success_WithNeedsImprovementRating() {
        // Test with NEEDS_IMPROVEMENT rating
        FeedBack feedBack = FeedBack.builder()
                .uuid("feedback-uuid-4")
                .tenantId("pg")
                .rating(Rating.NEEDS_IMPROVEMENT)
                .feedback("Needs improvement")
                .build();

        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(feedBack);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<FeedBackResponse> response = inPortalSurveyController.createFeedBack(feedBackRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(Rating.NEEDS_IMPROVEMENT, response.getBody().getFeedback().getRating());

        verify(inPortalSurveyService, times(1)).createFeedBack(feedBackRequest);
    }

    @Test
    public void testCreateFeedBack_Success_WithoutOptionalFields() {
        // Test with minimal required fields
        FeedBack feedBack = FeedBack.builder()
                .rating(Rating.VERY_CONVENIENT)
                .build();

        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(feedBack)
                .build();

        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(feedBack);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<FeedBackResponse> response = inPortalSurveyController.createFeedBack(feedBackRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNull(response.getBody().getFeedback().getUuid());
        assertNull(response.getBody().getFeedback().getFeedback());

        verify(inPortalSurveyService, times(1)).createFeedBack(feedBackRequest);
    }

    // ==================== RemindMeLater Endpoint Tests ====================

    @Test
    public void testCreateRemindMeLater_Success() {
        // Arrange
        RemindMeLaterRequest remindMeLaterRequest = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        doNothing().when(inPortalSurveyService).createRemindMeLater(any(RemindMeLaterRequest.class));
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<RemindMeLaterResponse> response = inPortalSurveyController.createRemindMeLater(remindMeLaterRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(responseInfo, response.getBody().getResponseInfo());

        verify(inPortalSurveyService, times(1)).createRemindMeLater(remindMeLaterRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    public void testCreateRemindMeLater_Success_WithDifferentUser() {
        // Arrange
        User differentUser = User.builder()
                .uuid("different-user-uuid")
                .userName("differentuser")
                .build();

        RequestInfo differentRequestInfo = RequestInfo.builder()
                .userInfo(differentUser)
                .build();

        RemindMeLaterRequest remindMeLaterRequest = RemindMeLaterRequest.builder()
                .requestInfo(differentRequestInfo)
                .build();

        doNothing().when(inPortalSurveyService).createRemindMeLater(any(RemindMeLaterRequest.class));
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Act
        ResponseEntity<RemindMeLaterResponse> response = inPortalSurveyController.createRemindMeLater(remindMeLaterRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        verify(inPortalSurveyService, times(1)).createRemindMeLater(remindMeLaterRequest);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(differentRequestInfo, true);
    }

    // ==================== Integration Tests ====================

    @Test
    public void testAllEndpoints_VerifyResponseInfoFactoryInvocation() {
        // This test ensures that all endpoints properly invoke the ResponseInfoFactory

        // Test Eligibility
        EligibilityRequest eligibilityRequest = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        when(inPortalSurveyService.checkEligibility(any(EligibilityRequest.class)))
                .thenReturn(Eligibility.builder().isEligible(true).build());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        inPortalSurveyController.createEligibility(eligibilityRequest);

        // Test FeedBack
        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(FeedBack.builder().rating(Rating.VERY_CONVENIENT).build())
                .build();

        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(feedBackRequest.getFeedBack());

        inPortalSurveyController.createFeedBack(feedBackRequest);

        // Test RemindMeLater
        RemindMeLaterRequest remindMeLaterRequest = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        doNothing().when(inPortalSurveyService).createRemindMeLater(any(RemindMeLaterRequest.class));

        inPortalSurveyController.createRemindMeLater(remindMeLaterRequest);

        // Verify all three endpoints called responseInfoFactory with true flag
        verify(responseInfoFactory, times(3)).createResponseInfoFromRequestInfo(any(RequestInfo.class), eq(true));
    }

    @Test
    public void testAllEndpoints_VerifyServiceInvocation() {
        // This test ensures that all endpoints properly invoke their respective service methods

        // Test Eligibility
        EligibilityRequest eligibilityRequest = EligibilityRequest.builder()
                .requestInfo(requestInfo)
                .build();

        when(inPortalSurveyService.checkEligibility(eligibilityRequest))
                .thenReturn(Eligibility.builder().isEligible(true).build());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        inPortalSurveyController.createEligibility(eligibilityRequest);
        verify(inPortalSurveyService, times(1)).checkEligibility(eligibilityRequest);

        // Test FeedBack
        FeedBackRequest feedBackRequest = FeedBackRequest.builder()
                .requestInfo(requestInfo)
                .feedBack(FeedBack.builder().rating(Rating.VERY_CONVENIENT).build())
                .build();

        when(inPortalSurveyService.createFeedBack(feedBackRequest))
                .thenReturn(feedBackRequest.getFeedBack());

        inPortalSurveyController.createFeedBack(feedBackRequest);
        verify(inPortalSurveyService, times(1)).createFeedBack(feedBackRequest);

        // Test RemindMeLater
        RemindMeLaterRequest remindMeLaterRequest = RemindMeLaterRequest.builder()
                .requestInfo(requestInfo)
                .build();

        doNothing().when(inPortalSurveyService).createRemindMeLater(remindMeLaterRequest);

        inPortalSurveyController.createRemindMeLater(remindMeLaterRequest);
        verify(inPortalSurveyService, times(1)).createRemindMeLater(remindMeLaterRequest);
    }

    @Test
    public void testResponseEntityStatusCodes() {
        // Verify all endpoints return HTTP 200 OK

        // Setup mocks
        when(inPortalSurveyService.checkEligibility(any(EligibilityRequest.class)))
                .thenReturn(Eligibility.builder().isEligible(true).build());
        when(inPortalSurveyService.createFeedBack(any(FeedBackRequest.class)))
                .thenReturn(FeedBack.builder().rating(Rating.VERY_CONVENIENT).build());
        doNothing().when(inPortalSurveyService).createRemindMeLater(any(RemindMeLaterRequest.class));
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), anyBoolean()))
                .thenReturn(responseInfo);

        // Test Eligibility
        ResponseEntity<EligibilityResponse> eligibilityResponse = inPortalSurveyController.createEligibility(
                EligibilityRequest.builder().requestInfo(requestInfo).build());
        assertEquals(HttpStatus.OK, eligibilityResponse.getStatusCode());

        // Test FeedBack
        ResponseEntity<FeedBackResponse> feedBackResponse = inPortalSurveyController.createFeedBack(
                FeedBackRequest.builder()
                        .requestInfo(requestInfo)
                        .feedBack(FeedBack.builder().rating(Rating.VERY_CONVENIENT).build())
                        .build());
        assertEquals(HttpStatus.OK, feedBackResponse.getStatusCode());

        // Test RemindMeLater
        ResponseEntity<RemindMeLaterResponse> remindMeLaterResponse = inPortalSurveyController.createRemindMeLater(
                RemindMeLaterRequest.builder().requestInfo(requestInfo).build());
        assertEquals(HttpStatus.OK, remindMeLaterResponse.getStatusCode());
    }

}
