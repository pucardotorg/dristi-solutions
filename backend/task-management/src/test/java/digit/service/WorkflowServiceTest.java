package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import digit.web.models.WorkflowObject;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private ObjectMapper mapper;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private Configuration config;

    @InjectMocks
    private WorkflowService workflowService;

    private TaskManagementRequest request;
    private TaskManagement taskManagement;
    private RequestInfo requestInfo;
    private WorkflowObject workflow;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setComments("Test comment");
        taskManagement = TaskManagement.builder()
                .id("task-id-123")
                .taskManagementNumber("TM-001")
                .tenantId("kl")
                .workflow(workflow)
                .build();
        request = TaskManagementRequest.builder()
                .requestInfo(requestInfo)
                .taskManagement(taskManagement)
                .build();
    }

    @Test
    void updateWorkflowStatus_UpdatesTaskStatus() {
        State state = new State();
        state.setState("PENDING_APPROVAL");
        
        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setState(state);
        
        ProcessInstanceResponse response = new ProcessInstanceResponse();
        response.setProcessInstances(Collections.singletonList(processInstance));

        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/egov-workflow-v2/process/_transition");
        when(config.getTaskBusinessName()).thenReturn("task-management");
        when(config.getTaskBusinessServiceName()).thenReturn("TASK_MANAGEMENT");
        when(repository.fetchResult(any(), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(response);

        workflowService.updateWorkflowStatus(request);

        assertEquals("PENDING_APPROVAL", taskManagement.getStatus());
    }

    @Test
    void updateWorkflowStatus_ExceptionThrown_ThrowsCustomException() {
        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/egov-workflow-v2/process/_transition");
        when(config.getTaskBusinessName()).thenReturn("task-management");
        when(config.getTaskBusinessServiceName()).thenReturn("TASK_MANAGEMENT");
        when(repository.fetchResult(any(), any())).thenThrow(new RuntimeException("Connection failed"));

        CustomException exception = assertThrows(CustomException.class, 
            () -> workflowService.updateWorkflowStatus(request));

        assertEquals("WORKFLOW_SERVICE_EXCEPTION", exception.getCode());
    }

    @Test
    void callWorkFlow_ReturnsState() {
        State expectedState = new State();
        expectedState.setState("APPROVED");
        
        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setState(expectedState);
        
        ProcessInstanceResponse response = new ProcessInstanceResponse();
        response.setProcessInstances(Collections.singletonList(processInstance));

        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/egov-workflow-v2/process/_transition");
        when(repository.fetchResult(any(), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(response);

        // Create a mock ProcessInstanceRequest
        org.egov.common.contract.workflow.ProcessInstanceRequest workflowReq = 
            new org.egov.common.contract.workflow.ProcessInstanceRequest();
        workflowReq.setRequestInfo(requestInfo);

        State result = workflowService.callWorkFlow(workflowReq);

        assertEquals("APPROVED", result.getState());
    }

    @Test
    void callWorkFlow_ExceptionThrown_ThrowsCustomException() {
        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/egov-workflow-v2/process/_transition");
        when(repository.fetchResult(any(), any())).thenThrow(new RuntimeException("Service unavailable"));

        org.egov.common.contract.workflow.ProcessInstanceRequest workflowReq = 
            new org.egov.common.contract.workflow.ProcessInstanceRequest();

        CustomException exception = assertThrows(CustomException.class, 
            () -> workflowService.callWorkFlow(workflowReq));

        assertEquals("WORKFLOW_SERVICE_EXCEPTION", exception.getCode());
    }

    @Test
    void updateWorkflowStatus_CustomExceptionThrown_RethrowsSameException() {
        when(config.getWfHost()).thenReturn("http://localhost:8080");
        when(config.getWfTransitionPath()).thenReturn("/egov-workflow-v2/process/_transition");
        when(config.getTaskBusinessName()).thenReturn("task-management");
        when(config.getTaskBusinessServiceName()).thenReturn("TASK_MANAGEMENT");
        
        CustomException customException = new CustomException("CUSTOM_ERROR", "Custom error message");
        when(repository.fetchResult(any(), any())).thenThrow(customException);

        CustomException exception = assertThrows(CustomException.class, 
            () -> workflowService.updateWorkflowStatus(request));

        assertEquals("CUSTOM_ERROR", exception.getCode());
    }
}
