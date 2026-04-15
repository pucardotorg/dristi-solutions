package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
import org.egov.common.contract.models.Workflow;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock private ObjectMapper mapper;
    @Mock private ServiceRequestRepository repository;
    @Mock private Configuration config;

    @InjectMocks
    private WorkflowService workflowService;

    private CtcApplication application;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder().uuid("user-1").build())
                .build();

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("APPROVE");

        application = CtcApplication.builder()
                .ctcApplicationNumber("CA-001")
                .tenantId("pb")
                .workflow(workflow)
                .build();

        lenient().when(config.getWfHost()).thenReturn("http://localhost:8080");
        lenient().when(config.getWfTransitionPath()).thenReturn("/workflow/process/_transition");
        lenient().when(config.getCtcBusinessName()).thenReturn("ctc");
        lenient().when(config.getCtcBusinessServiceName()).thenReturn("ctc-services");
    }

    @Test
    void updateWorkflowStatus_shouldSetStatusFromWorkflowResponse() {
        State state = new State();
        state.setState("APPROVED");

        ProcessInstance pi = new ProcessInstance();
        pi.setState(state);
        ProcessInstanceResponse response = new ProcessInstanceResponse();
        response.setProcessInstances(Collections.singletonList(pi));

        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(response);

        workflowService.updateWorkflowStatus(application, requestInfo);

        assertEquals("APPROVED", application.getStatus());
    }

    @Test
    void updateWorkflowStatus_shouldThrowCustomExceptionOnError() {
        when(repository.fetchResult(any(StringBuilder.class), any())).thenThrow(new RuntimeException("WF error"));

        assertThrows(CustomException.class, () -> workflowService.updateWorkflowStatus(application, requestInfo));
    }

    @Test
    void updateWorkflowStatus_shouldRethrowCustomException() {
        when(repository.fetchResult(any(StringBuilder.class), any()))
                .thenThrow(new CustomException("WF_ERROR", "workflow error"));

        CustomException ex = assertThrows(CustomException.class,
                () -> workflowService.updateWorkflowStatus(application, requestInfo));
        assertEquals("WF_ERROR", ex.getCode());
    }

    @Test
    void getProcessInstance_shouldMapFieldsCorrectly() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("SUBMIT");
        workflow.setComments("Test comment");
        workflow.setAssignes(List.of("uuid-1", "uuid-2"));
        application.setWorkflow(workflow);

        ProcessInstanceObject result = workflowService.getProcessInstance(application);

        assertEquals("CA-001", result.getBusinessId());
        assertEquals("SUBMIT", result.getAction());
        assertEquals("ctc", result.getModuleName());
        assertEquals("pb", result.getTenantId());
        assertEquals("ctc-services", result.getBusinessService());
        assertEquals("Test comment", result.getComment());
        assertEquals(2, result.getAssignes().size());
    }

    @Test
    void getProcessInstance_shouldHandleNullAssignes() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("SUBMIT");
        workflow.setAssignes(null);
        application.setWorkflow(workflow);

        ProcessInstanceObject result = workflowService.getProcessInstance(application);

        assertNull(result.getAssignes());
    }

    @Test
    void getProcessInstance_shouldHandleEmptyAssignes() {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("SUBMIT");
        workflow.setAssignes(Collections.emptyList());
        application.setWorkflow(workflow);

        ProcessInstanceObject result = workflowService.getProcessInstance(application);

        assertNull(result.getAssignes());
    }

    @Test
    void callWorkFlow_shouldReturnState() {
        State state = new State();
        state.setState("PENDING_PAYMENT");

        ProcessInstance pi = new ProcessInstance();
        pi.setState(state);
        ProcessInstanceResponse response = new ProcessInstanceResponse();
        response.setProcessInstances(Collections.singletonList(pi));

        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(new HashMap<>());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(response);

        State result = workflowService.callWorkFlow(null);

        assertEquals("PENDING_PAYMENT", result.getState());
    }

    @Test
    void callWorkFlow_shouldThrowCustomExceptionOnError() {
        when(repository.fetchResult(any(StringBuilder.class), any())).thenThrow(new RuntimeException("error"));

        assertThrows(CustomException.class, () -> workflowService.callWorkFlow(null));
    }

    @Test
    void getWorkflowFromProcessInstance_shouldReturnNull_whenNull() {
        assertNull(workflowService.getWorkflowFromProcessInstance(null));
    }

    @Test
    void getWorkflowFromProcessInstance_shouldMapStateAndComment() {
        State state = new State();
        state.setState("APPROVED");

        ProcessInstance pi = new ProcessInstance();
        pi.setState(state);
        pi.setComment("All good");

        Workflow result = workflowService.getWorkflowFromProcessInstance(pi);

        assertEquals("APPROVED", result.getAction());
        assertEquals("All good", result.getComments());
    }
}
