package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.common.contract.user.UserDetailResponse;
import org.egov.common.contract.user.UserSearchRequest;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.UserUtil;
import org.pucar.dristi.web.models.*;


import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WorkflowServiceTest {

    @InjectMocks
    private WorkflowService workflowService;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private Configuration config;

    @Mock
    private Application mockApplication;
    @Mock
    private ObjectMapper mapper;

    @Mock
    private UserUtil userUtil;

    WorkflowObject workflow = new WorkflowObject();
    @BeforeEach
    void setUp() {
        workflow.setAction("APPROVE");
    }
    @Test
    void updateWorkflowStatus_Success() {
        // Mock AdvocateRequest
        ApplicationRequest applicationRequest = new ApplicationRequest();
        applicationRequest.setRequestInfo(new RequestInfo());
        Application application = new Application();
        application.setApplicationNumber("APP001");
        application.setTenantId("tenant1");
        application.setWorkflow(workflow);
        applicationRequest.setApplication(application);

        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/workflow/transition");

        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setState(new State());
        ProcessInstanceResponse workflowRequest = new ProcessInstanceResponse(new ResponseInfo(), Collections.singletonList(processInstance));

        // Mock repository.fetchResult
        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(workflowRequest);
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(workflowRequest);

        // Execute the method
        assertDoesNotThrow(() -> workflowService.updateWorkflowStatus(applicationRequest));
    }

    @Test
    void updateWorkflowStatus_Exceptions() {
        // Mock EvidenceRequest
        ApplicationRequest applicationRequest = new ApplicationRequest();
        applicationRequest.setRequestInfo(new RequestInfo());
        Application application = new Application();
        application.setApplicationNumber("APP001");
        application.setTenantId("tenant1");
        application.setWorkflow(workflow);
        applicationRequest.setApplication(application);

        // Execute the method
        assertThrows(CustomException.class, () -> workflowService.updateWorkflowStatus(applicationRequest));
    }
    @Test
    public void testSetBusinessServiceAccordingToWorkflow_ReferenceIdIsNull() {

        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfProcessInstanceSearchPath()).thenReturn("/workflow/search");

        RequestInfo requestInfo = new RequestInfo();
        StringBuilder url = new StringBuilder(config.getWfHost().concat(config.getWfProcessInstanceSearchPath()));
        // Mock repository.fetchResult to throw generic Exception
        when(repository.fetchResult(any(),any())).thenReturn(new Object());

        // Arrange
        when(mockApplication.getReferenceId()).thenReturn(null);
        when(mockApplication.getApplicationNumber()).thenReturn("123");
        when(mockApplication.getTenantId()).thenReturn("Tt");

        // Act
        String result = workflowService.getBusinessServiceFromAppplication(mockApplication, requestInfo);

        // Assert
        assertEquals(config.getAsyncVoluntarySubBusinessServiceName(), result);
    }

    @Test
    void updateWorkflowStatus_Exception() {
        ApplicationRequest applicationRequest = new ApplicationRequest();
        applicationRequest.setRequestInfo(new RequestInfo());
        Application application = new Application();
        application.setApplicationNumber("APP001");
        application.setTenantId("tenant1");
        application.setWorkflow(workflow);
        applicationRequest.setApplication(application);

        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setState(new State());

        // Execute the method
        assertThrows(Exception.class, () -> {workflowService.updateWorkflowStatus(applicationRequest);
        });
    }

    @Test
    void callWorkFlow_CustomException() {
        // Mock ProcessInstanceRequest
        ProcessInstanceRequest workflowReq = new ProcessInstanceRequest();
        workflowReq.setRequestInfo(new RequestInfo());

        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/workflow/transition");

        StringBuilder url = new StringBuilder(config.getWfHost().concat(config.getWfTransitionPath()));

        // Mock repository.fetchResult to throw CustomException
        when(repository.fetchResult(url, workflowReq)).thenThrow(new CustomException());

        // Execute the method
        assertThrows(CustomException.class, () -> workflowService.callWorkFlow(workflowReq));
    }

    @Test
    void callWorkFlow_Exception() {
        // Mock ProcessInstanceRequest
        ProcessInstanceRequest workflowReq = new ProcessInstanceRequest();
        workflowReq.setRequestInfo(new RequestInfo());

        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/workflow/transition");

        StringBuilder url = new StringBuilder(config.getWfHost().concat(config.getWfTransitionPath()));

        // Mock repository.fetchResult to throw generic Exception
        when(repository.fetchResult(url, workflowReq)).thenThrow(new RuntimeException("Generic Exception"));

        // Execute the method
        assertThrows(CustomException.class, () -> workflowService.callWorkFlow(workflowReq));
    }

    @Test
    void getUserListFromUserUuid_withValidUuids_returnsUserList() {
        // Given
        List<String> uuids = List.of("uuid1", "uuid2");
        User user1 = User.builder().uuid("uuid1").build();
        User user2 = User.builder().uuid("uuid2").build();
        UserDetailResponse userDetailResponse = new UserDetailResponse(ResponseInfo.builder().build(),List.of(user1, user2));
        when(config.getUserSearchEndpoint()).thenReturn("search");
        when(config.getUserHost()).thenReturn("http://localhost:8080/user/");
        when(userUtil.userCall(any(UserSearchRequest.class), any(StringBuilder.class))).thenReturn(userDetailResponse);

        // When
        List<User> result = workflowService.getUserListFromUserUuid(uuids);

        // Then
        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(user -> user.getUuid().equals("uuid1")));
        assertTrue(result.stream().anyMatch(user -> user.getUuid().equals("uuid2")));
    }

    @Test
    void getUserListFromUserUuid_withEmptyUuidList_returnsEmptyList() {
        // Given
        List<String> uuids = Collections.emptyList();

        // When
        List<User> result = workflowService.getUserListFromUserUuid(uuids);

        // Then
        assertTrue(result.isEmpty());
    }

    @Test
    void getUserListFromUserUuid_withNullUuidList_returnsEmptyList() {
        // Given
        List<String> uuids = null;

        // When
        List<User> result = workflowService.getUserListFromUserUuid(uuids);

        // Then
        assertTrue(result.isEmpty());
    }

    @Test
    void getUserListFromUserUuid_withInvalidUuids_returnsEmptyList() {
        // Given
        List<String> uuids = List.of("invalidUuid");
        when(config.getUserSearchEndpoint()).thenReturn("search");
        when(config.getUserHost()).thenReturn("http://localhost:8080/user/");
        when(userUtil.userCall(any(UserSearchRequest.class), any(StringBuilder.class))).thenReturn(null);

        // When
        List<User> result = workflowService.getUserListFromUserUuid(uuids);

        // Then
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetProcessInstanceForApplicationPayment_ValidBusinessService() {
        // Arrange
        String tenantId = "tenant-id";
        String businessService = "orderSubBusinessService";
        String businessName = "Order Sub Business";
        ApplicationSearchRequest updateRequest = new ApplicationSearchRequest();
        updateRequest.setRequestInfo(new RequestInfo());
        ApplicationCriteria criteria = ApplicationCriteria.builder()
                .applicationNumber("12345")
                .build();
        updateRequest.setCriteria(criteria);

        when(config.getAsyncOrderSubBusinessServiceName()).thenReturn("orderSubBusinessService");
        when(config.getAsyncOrderSubBusinessName()).thenReturn(businessName);

        // Act
        ProcessInstanceRequest processInstanceRequest = workflowService.getProcessInstanceForApplicationPayment(updateRequest, tenantId, businessService);

        // Assert
        assertNotNull(processInstanceRequest);
        assertEquals(1, processInstanceRequest.getProcessInstances().size());
        ProcessInstance processInstance = processInstanceRequest.getProcessInstances().get(0);
        assertEquals(businessService, processInstance.getBusinessService());
        assertEquals(criteria.getApplicationNumber(), processInstance.getBusinessId());
        assertEquals("Payment for Application processed", processInstance.getComment());
        assertEquals(businessName, processInstance.getModuleName());
        assertEquals(tenantId, processInstance.getTenantId());
        assertEquals("PAY", processInstance.getAction());
    }

    @Test
    void testGetProcessInstanceForApplicationPayment_InvalidBusinessService() {
        // Arrange
        String tenantId = "tenant-id";
        String businessService = "invalidBusinessService";
        ApplicationSearchRequest updateRequest = new ApplicationSearchRequest();
        updateRequest.setRequestInfo(new RequestInfo());
        ApplicationCriteria criteria = ApplicationCriteria.builder()
                .filingNumber("12345")
                .build();
        updateRequest.setCriteria(criteria);

        when(config.getAsyncOrderSubBusinessServiceName()).thenReturn("orderSubBusinessService");
        when(config.getAsyncOrderSubWithResponseBusinessServiceName()).thenReturn("orderSubWithResponseBusinessService");
        when(config.getAsyncVoluntarySubBusinessServiceName()).thenReturn("voluntarySubBusinessService");

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () ->
                workflowService.getProcessInstanceForApplicationPayment(updateRequest, tenantId, businessService)
        );
        assertEquals("No business name found for the business service: " + businessService, exception.getMessage());
    }
}
