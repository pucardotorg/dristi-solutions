package org.pucar.dristi.service;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.pucar.dristi.config.ServiceConstants.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.ApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ApplicationRepository;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.SmsNotificationUtil;
import org.pucar.dristi.validator.ApplicationValidator;
import org.pucar.dristi.web.models.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

class ApplicationServiceTest {

    @InjectMocks
    private ApplicationService applicationService;

    @Mock
    private ApplicationValidator validator;

    @Mock
    private ApplicationEnrichment enrichmentUtil;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private SmsNotificationUtil smsNotificationUtil;

    @Mock
    private Configuration config;

    @Mock
    private Producer producer;

    @Mock
    private ApplicationRequest applicationRequest;

    @Mock
    private ApplicationExistsRequest applicationExistsRequest;


    @Mock
    private Application application;

    @Mock
    private RequestInfo requestInfo;

    @Mock
    private FileStoreUtil fileStoreUtil;

    @Mock
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateApplication_success() {
        // Arrange
        Application application = new Application();
        ApplicationRequest applicationRequest = new ApplicationRequest();
        applicationRequest.setApplication(application);

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        application.setWorkflow(workflow);
        when(config.getApplicationCreateTopic()).thenReturn("save-application");

        // Act
        Application result = applicationService.createApplication(applicationRequest);

        // Assert
        verify(validator).validateApplication(applicationRequest);
        verify(enrichmentUtil).enrichApplication(applicationRequest);
        verify(workflowService).updateWorkflowStatus(applicationRequest);
        verify(producer).push("save-application", applicationRequest);
        assertEquals(application, result);
    }

    @Test
    void testCreateApplication_failure() {
        // Arrange
        doThrow(new RuntimeException("Validation failed")).when(validator).validateApplication(any());

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            applicationService.createApplication(applicationRequest);
        });

        assertEquals(CREATE_APPLICATION_ERR, exception.getCode());
        assertEquals("Validation failed", exception.getMessage());
        verify(validator).validateApplication(applicationRequest);
        verify(enrichmentUtil, never()).enrichApplication(applicationRequest);
        verify(workflowService, never()).updateWorkflowStatus(applicationRequest);
        verify(producer, never()).push(anyString(), any());
    }


    @Test
    void testUpdateApplication_success() {
        // Arrange
        when(applicationRequest.getApplication()).thenReturn(application);
        when(applicationRequest.getRequestInfo()).thenReturn(requestInfo);
        when(validator.validateApplicationExistence(any(), any())).thenReturn(true);
        when(config.getApplicationUpdateTopic()).thenReturn("update-application");

        // Act
        Application result = applicationService.updateApplication(applicationRequest,false);

        // Assert
        verify(validator).validateApplicationExistence(requestInfo, application);
        verify(enrichmentUtil).enrichApplicationUponUpdate(applicationRequest);
        verify(producer).push("update-application", applicationRequest);
        assertEquals(application, result);
    }

    @Test
    public void testUpdateApplication_WhenRejected_ShouldEnrichAndPushToProducer() {
        // Arrange
        ApplicationRequest mockRequest = mock(ApplicationRequest.class);
        Application mockApplication = mock(Application.class);
        RequestInfo mockRequestInfo = mock(RequestInfo.class);

        when(mockRequest.getApplication()).thenReturn(mockApplication);
        when(mockRequest.getRequestInfo()).thenReturn(mockRequestInfo);

        // Mock validator behavior
        when(validator.validateApplicationExistence(mockRequestInfo, mockApplication)).thenReturn(true);

        // Mock enrichment and workflow services
        doNothing().when(enrichmentUtil).enrichApplicationUponUpdate(mockRequest);
        doNothing().when(enrichmentUtil).enrichApplicationNumberByCMPNumber(mockRequest);
        doNothing().when(workflowService).updateWorkflowStatus(mockRequest);

        // Mock producer push behavior
        doNothing().when(producer).push(anyString(), eq(mockRequest));

        // Mock config topic
        when(config.getApplicationUpdateTopic()).thenReturn("application-update-topic");

        doNothing().when(smsNotificationUtil).callNotificationService(any(), any(), any());
        // Act
        Application result = applicationService.updateApplication(mockRequest,false);


        // Assert
        verify(producer).push("application-update-topic", mockRequest); // Should push the update
        assertEquals(mockApplication, result); // Returned application should be the same

        // No exceptions should be thrown
    }

    @Test
    void testUpdateApplication_validationFailure() {
        // Arrange
        when(applicationRequest.getApplication()).thenReturn(application);
        when(applicationRequest.getRequestInfo()).thenReturn(requestInfo);
        doThrow(new RuntimeException("Validation failed")).when(validator).validateApplicationExistence(any(), any());

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            applicationService.updateApplication(applicationRequest,false);
        });

        assertEquals("Error occurred while updating application: Validation failed", exception.getMessage());
        verify(validator).validateApplicationExistence(requestInfo, application);
        verify(enrichmentUtil, never()).enrichApplicationUponUpdate(applicationRequest);
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testUpdateApplication_validation_False() {
        // Arrange
        when(applicationRequest.getApplication()).thenReturn(application);
        when(applicationRequest.getRequestInfo()).thenReturn(requestInfo);
        when(validator.validateApplicationExistence(any(), any())).thenReturn(false);

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            applicationService.updateApplication(applicationRequest,false);
        });

        assertEquals("Error occurred while validating existing application", exception.getMessage());
        verify(validator).validateApplicationExistence(requestInfo, application);
        verify(enrichmentUtil, never()).enrichApplicationUponUpdate(applicationRequest);
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testUpdateApplication_generalFailure() {
        // Arrange
        when(applicationRequest.getApplication()).thenReturn(application);
        when(applicationRequest.getRequestInfo()).thenReturn(requestInfo);
        when(validator.validateApplicationExistence(any(), any())).thenReturn(true);
        doThrow(new RuntimeException("Unexpected error")).when(enrichmentUtil).enrichApplicationUponUpdate(any());

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            applicationService.updateApplication(applicationRequest,false);
        });

        assertEquals("Error occurred while updating application: Unexpected error", exception.getMessage());
        verify(validator).validateApplicationExistence(requestInfo, application);
        verify(enrichmentUtil).enrichApplicationUponUpdate(applicationRequest);
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    public void testSearchApplication_success() {
        // Arrange
        ApplicationSearchRequest applicationSearchRequest = new ApplicationSearchRequest();
        applicationSearchRequest.setRequestInfo(new RequestInfo());
        List<Application> applicationList = new ArrayList<>();
        Application mockApplication = new Application();
        mockApplication.setId(UUID.randomUUID());
        applicationList.add(mockApplication);

        // Act
        List<Application> result = applicationService.searchApplications(applicationSearchRequest);

        // Assert
        assertNotNull(result);
        verify(applicationRepository, times(1)).getApplications(applicationSearchRequest);
    }

    @Test
    public void testSearchApplications_NoResults() {
        // Arrange
        when(applicationRepository.getApplications(any())).thenReturn(new ArrayList<>());

        // Act
        List<Application> result = applicationService.searchApplications(new ApplicationSearchRequest());

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(applicationRepository, times(1)).getApplications(any());
    }


    @Test
    void testSearchApplicationHandleException() {
        when(applicationRepository.getApplications(null)).thenThrow(new RuntimeException("Database error"));

        CustomException exception = assertThrows(CustomException.class, () ->
                applicationService.searchApplications(null));

        assertEquals(APPLICATION_SEARCH_ERR, exception.getCode());
        assertEquals("Database error", exception.getMessage());
    }

    @Test
    void testExistsApplication_Success() {
        List<ApplicationExists> expectedResponse = Collections.singletonList(new ApplicationExists("filingNum", "cnr", "app123", true));
        when(applicationRepository.checkApplicationExists(applicationExistsRequest.getApplicationExists()))
                .thenReturn(expectedResponse);

        List<ApplicationExists> actualResponse = applicationService.existsApplication(applicationExistsRequest);

        assertEquals(expectedResponse, actualResponse);
        verify(applicationRepository).checkApplicationExists(applicationExistsRequest.getApplicationExists());
    }

    @Test
    void testExistsApplication_CustomException() {
        when(applicationRepository.checkApplicationExists(applicationExistsRequest.getApplicationExists()))
                .thenThrow(new RuntimeException("Database error"));

        CustomException thrown = assertThrows(CustomException.class, () -> {
            applicationService.existsApplication(applicationExistsRequest);
        });

        assertEquals("Database error", thrown.getMessage());
        verify(applicationRepository).checkApplicationExists(applicationExistsRequest.getApplicationExists());
    }

    @Test
    void testExistsApplication_Throws_Exception() {
        when(applicationRepository.checkApplicationExists(applicationExistsRequest.getApplicationExists()))
                .thenThrow(new RuntimeException("Database error"));

        Exception thrown = assertThrows(Exception.class, () -> {
            applicationService.existsApplication(applicationExistsRequest);
        });

        assertEquals("Database error", thrown.getMessage());
        verify(applicationRepository).checkApplicationExists(applicationExistsRequest.getApplicationExists());
    }
    @Test
    void addComments_Success() {
        ApplicationAddCommentRequest request = new ApplicationAddCommentRequest();
        ApplicationAddComment applicationAddComment = new ApplicationAddComment();
        applicationAddComment.setApplicationNumber("app123");
        applicationAddComment.setTenantId("tenant1");
        Comment comment = new Comment();
        applicationAddComment.setComment(Collections.singletonList(comment));
        User userInfo = User.builder().uuid("user-uuid").tenantId("tenant-id").build();
        RequestInfo requestInfoLocal = RequestInfo.builder().userInfo(userInfo).build();
        request.setRequestInfo(requestInfoLocal);
        request.setApplicationAddComment(applicationAddComment);

        Application application = new Application();
        application.setApplicationNumber("app123");
        application.setTenantId("tenant1");
        application.setComment(null);
        AuditDetails auditDetails = AuditDetails.builder().build();
        application.setAuditDetails(auditDetails);

        when(applicationRepository.getApplications(any())).thenReturn(Collections.singletonList(application));
        when(config.getApplicationUpdateCommentsTopic()).thenReturn("update-comments");
        doNothing().when(producer).push(anyString(), any());

        applicationService.addComments(request);

        verify(applicationRepository).getApplications(any());
        verify(producer).push(anyString(), any());
    }

    @Test
    void addComments_ApplicationNotFound() {
        ApplicationAddCommentRequest request = new ApplicationAddCommentRequest();
        ApplicationAddComment applicationAddComment = new ApplicationAddComment();
        applicationAddComment.setApplicationNumber("app123");
        applicationAddComment.setTenantId("tenant1");
        request.setApplicationAddComment(applicationAddComment);
        request.setRequestInfo(new RequestInfo());

        when(applicationRepository.getApplications(any())).thenReturn(Collections.emptyList());

        CustomException exception = assertThrows(CustomException.class, () -> {
            applicationService.addComments(request);
        });

        assertEquals(VALIDATION_ERR, exception.getCode());
        assertEquals("Application not found", exception.getMessage());
        verify(applicationRepository).getApplications(any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void addComments_EnrichmentFailure() {
        ApplicationAddCommentRequest request = new ApplicationAddCommentRequest();
        ApplicationAddComment applicationAddComment = new ApplicationAddComment();
        applicationAddComment.setApplicationNumber("app123");
        applicationAddComment.setTenantId("tenant1");
        Comment comment = new Comment();
        applicationAddComment.setComment(Collections.singletonList(comment));
        request.setApplicationAddComment(applicationAddComment);
        User userInfo = User.builder().uuid("user-uuid").tenantId("tenant-id").build();
        RequestInfo requestInfoLocal = RequestInfo.builder().userInfo(userInfo).build();
        request.setRequestInfo(requestInfoLocal);
        request.setApplicationAddComment(applicationAddComment);

        Application application = new Application();
        application.setApplicationNumber("app123");
        application.setTenantId("tenant1");
        application.setComment(new ArrayList<>());

        when(applicationRepository.getApplications(any())).thenReturn(Collections.singletonList(application));
        doThrow(new RuntimeException("Enrichment failed")).when(enrichmentUtil).enrichCommentUponCreate(any(), any());

        CustomException exception = assertThrows(CustomException.class, () -> {
            applicationService.addComments(request);
        });

        assertEquals(COMMENT_ADD_ERR, exception.getCode());
        assertEquals("Enrichment failed", exception.getMessage());
        verify(applicationRepository).getApplications(any());
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testUpdateApplication_filtersInactiveDocuments() {
        // Setup application and documents
        Application application = new Application();
        application.setApplicationType("SUBMIT_BAIL_DOCUMENTS");
        application.setStatus("PENDINGAPPROVAL"); // to match enrichment logic
        application.setTenantId("tenant123");

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("APPROVE");
        application.setWorkflow(workflow);

        Document activeDoc = new Document();
        activeDoc.setIsActive(true);
        activeDoc.setFileStore("file-active");

        Document inactiveDoc = new Document();
        inactiveDoc.setIsActive(false);
        inactiveDoc.setFileStore("file-inactive");

        application.setDocuments(List.of(activeDoc, inactiveDoc));


        ApplicationRequest applicationRequest = new ApplicationRequest();
        applicationRequest.setApplication(application);
        RequestInfo requestInfo = new RequestInfo();
        User user = new User();
        user.setUuid("user-uuid");
        user.setTenantId("tenant123");
        user.setRoles(new ArrayList<>());
        requestInfo.setUserInfo(user);
        applicationRequest.setRequestInfo(requestInfo);

        // Mocks
        when(validator.validateApplicationExistence(any(), any())).thenReturn(true);
        doNothing().when(enrichmentUtil).enrichApplicationUponUpdate(applicationRequest);
        doNothing().when(validator).validateOrderDetails(applicationRequest);
        doNothing().when(workflowService).updateWorkflowStatus(applicationRequest);
        doNothing().when(enrichmentUtil).enrichApplicationNumberByCMPNumber(applicationRequest);
        doNothing().when(fileStoreUtil).deleteFilesByFileStore(anyList(), eq("tenant123"));
        doNothing().when(smsNotificationUtil).callNotificationService(any(), anyString(), anyString());
        doNothing().when(producer).push(anyString(), any());

        when(config.getApplicationUpdateTopic()).thenReturn("app-update-topic");

        // Method call
        Application result = applicationService.updateApplication(applicationRequest, false);

        // Assertions
        assertNotNull(result);
        assertNotNull(result.getDocuments());
        assertEquals(1, result.getDocuments().size());
        assertTrue(result.getDocuments().get(0).getIsActive());

        // Verify side effects
        verify(fileStoreUtil).deleteFilesByFileStore(eq(List.of("file-inactive")), eq("tenant123"));
        verify(producer).push("app-update-topic", applicationRequest);
        verify(smsNotificationUtil).callNotificationService(applicationRequest, "PENDINGAPPROVAL", "SUBMIT_BAIL_DOCUMENTS");
    }


}
