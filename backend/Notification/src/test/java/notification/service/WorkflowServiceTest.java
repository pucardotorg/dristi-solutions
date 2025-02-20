package notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import notification.config.Configuration;
import notification.repository.ServiceRequestRepository;
import notification.web.models.Notification;
import notification.web.models.NotificationRequest;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.*;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkflowServiceTest {

    @Mock
    private ObjectMapper mapper;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private Configuration config;

    @InjectMocks
    private WorkflowService workflowService;

    private NotificationRequest notificationRequest;
    private ProcessInstanceResponse processInstanceResponse;
    private static final String TENANT_ID = "default";
    private static final String BUSINESS_ID = "BTR-2025-02-17-000001";

    @BeforeEach
    void setUp() {
        // Setup basic test data
        RequestInfo requestInfo = new RequestInfo();
        Notification notification = new Notification();
        notification.setTenantId(TENANT_ID);
        notification.setNotificationNumber(BUSINESS_ID);

        Workflow workflow = new Workflow();
        workflow.setAction("APPROVE");
        workflow.setAssignes(Arrays.asList("uuid1", "uuid2"));
        workflow.setComments("Test comment");

        notification.setWorkflow(workflow);

        notificationRequest = new NotificationRequest();
        notificationRequest.setRequestInfo(requestInfo);
        notificationRequest.setNotification(notification);

        // Setup workflow response
        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setState(State.builder().state("APPROVED").build());
        processInstanceResponse = new ProcessInstanceResponse();
        processInstanceResponse.setProcessInstances(Collections.singletonList(processInstance));
    }

    @Test
    void updateWorkflowStatus_Success() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfTransitionPath()).thenReturn("/transition");
        when(repository.fetchResult(any(), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(processInstanceResponse);

        assertDoesNotThrow(() -> workflowService.updateWorkflowStatus(notificationRequest));

        verify(repository).fetchResult(any(), any());
        verify(mapper).convertValue(any(), eq(ProcessInstanceResponse.class));
    }

    @Test
    void callWorkFlow_Success() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfTransitionPath()).thenReturn("/transition");
        when(repository.fetchResult(any(), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(processInstanceResponse);

        State result = workflowService.callWorkFlow(new ProcessInstanceRequest());

        assertNotNull(result);
        assertEquals("APPROVED", result.getState());
        verify(repository).fetchResult(any(), any());
    }

    @Test
    void getCurrentWorkflow_Success() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfBusinessServiceSearchPath()).thenReturn("/search");
        when(repository.fetchResult(any(), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(processInstanceResponse);

        ProcessInstance result = workflowService.getCurrentWorkflow(new RequestInfo(), TENANT_ID, BUSINESS_ID);

        assertNotNull(result);
        assertEquals("APPROVED", result.getState().getState());
    }

    @Test
    void getCurrentWorkflow_ParsingError() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfBusinessServiceSearchPath()).thenReturn("/search");
        when(repository.fetchResult(any(), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class)))
                .thenThrow(new IllegalArgumentException());

        CustomException exception = assertThrows(CustomException.class, () ->
                workflowService.getCurrentWorkflow(new RequestInfo(), TENANT_ID, BUSINESS_ID));
        assertEquals("PARSING_ERROR", exception.getCode());
    }

    @Test
    void getCurrentWorkflow_NoWorkflowFound() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfBusinessServiceSearchPath()).thenReturn("/search");
        when(repository.fetchResult(any(), any())).thenReturn(new Object());

        ProcessInstanceResponse emptyResponse = new ProcessInstanceResponse();
        emptyResponse.setProcessInstances(Collections.emptyList());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(emptyResponse);

        ProcessInstance result = workflowService.getCurrentWorkflow(new RequestInfo(), TENANT_ID, BUSINESS_ID);

        assertNull(result);
    }

    @Test
    void getBusinessService_Success() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfBusinessServiceSearchPath()).thenReturn("/search");

        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setBusinessId("BUSINESS_ID");
        processInstance.setTenantId("TENANT_ID");

        ProcessInstanceResponse processInstanceResponse = new ProcessInstanceResponse();
        processInstanceResponse.setProcessInstances(Collections.singletonList(processInstance));

        when(repository.fetchResult(any(), any())).thenReturn(processInstanceResponse);
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(processInstanceResponse);
        assertDoesNotThrow(() -> workflowService.getCurrentWorkflow(new RequestInfo(), TENANT_ID, BUSINESS_ID));
    }

    @Test
    void getBusinessService_ParsingError() {
        when(config.getWfHost()).thenReturn("http://workflow-service");
        when(config.getWfBusinessServiceSearchPath()).thenReturn("/search");
        when(repository.fetchResult(any(), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class)))
                .thenThrow(new IllegalArgumentException());

        // Execute and verify through getCurrentWorkflow
        CustomException exception = assertThrows(CustomException.class, () ->
                workflowService.getCurrentWorkflow(new RequestInfo(), TENANT_ID, BUSINESS_ID));
        assertEquals("PARSING_ERROR", exception.getCode());
    }
}
