package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.DigitalizedDocument;
import digit.web.models.WorkflowObject;
import digit.web.models.TypeEnum;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WorkflowServiceTest {

    @Mock private ObjectMapper mapper;
    @Mock private ServiceRequestRepository repository;
    @Mock private Configuration config;

    @InjectMocks private WorkflowService service;

    private DigitalizedDocument document;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("CREATE");
        when(config.getWfHost()).thenReturn("http://wf");
        when(config.getWfTransitionPath()).thenReturn("/transition");
        when(config.getDigitalizedDocumentModuleName()).thenReturn("DIGITALIZED_DOCUMENT");
        when(config.getPleaDigitalizedDocumentBusinessService()).thenReturn("PLEA_BS");
        when(config.getMediationDigitalizedDocumentBusinessService()).thenReturn("MEDIATION_BS");
        when(config.getExaminationOfAccusedDigitalizedDocumentBusinessService()).thenReturn("EOAA_BS");

        document = DigitalizedDocument.builder()
                .type(TypeEnum.PLEA)
                .tenantId("t1")
                .documentNumber("DN1")
                .workflow(workflowObject)
                .build();
        requestInfo = RequestInfo.builder().userInfo(User.builder().uuid("u1").build()).build();
    }

    @Test
    void updateWorkflowStatus_SetsStatusFromResponse() {
        // Prepare a successful workflow response
        State state = new State();
        state.setState("IN_PROGRESS");
        ProcessInstance pi = new ProcessInstance();
        pi.setState(state);
        ProcessInstanceResponse response = new ProcessInstanceResponse();
        response.setProcessInstances(List.of(pi));

        when(repository.fetchResult(any(StringBuilder.class), any()))
                .thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class)))
                .thenReturn(response);

        service.updateWorkflowStatus(digit.web.models.DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(document)
                .build());

        assertEquals("IN_PROGRESS", document.getStatus());
        verify(repository).fetchResult(any(StringBuilder.class), any());
        verify(mapper).convertValue(any(), eq(ProcessInstanceResponse.class));
    }

    @Test
    void updateWorkflowStatus_WhenWorkflowThrows_PropagatesCustomException() {
        when(repository.fetchResult(any(StringBuilder.class), any()))
                .thenThrow(new CustomException("WF_ERR", "boom"));

        CustomException ex = assertThrows(CustomException.class, () ->
                service.updateWorkflowStatus(digit.web.models.DigitalizedDocumentRequest.builder()
                        .requestInfo(requestInfo)
                        .digitalizedDocument(document)
                        .build())
        );
        assertEquals("WF_ERR", ex.getCode());
    }

    @Test
    void callWorkFlow_Success_ReturnsState() {
        State state = new State();
        state.setState("DONE");
        ProcessInstance pi = new ProcessInstance();
        pi.setState(state);
        ProcessInstanceResponse response = new ProcessInstanceResponse();
        response.setProcessInstances(List.of(pi));

        when(repository.fetchResult(any(StringBuilder.class), any()))
                .thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class)))
                .thenReturn(response);

        State out = service.callWorkFlow(new ProcessInstanceRequest(requestInfo, List.of(new ProcessInstance())));
        assertEquals("DONE", out.getState());
    }

    @Test
    void callWorkFlow_WhenRepositoryFails_ThrowsCustomException() {
        when(repository.fetchResult(any(StringBuilder.class), any()))
                .thenThrow(new RuntimeException("down"));

        CustomException ex = assertThrows(CustomException.class, () ->
                service.callWorkFlow(new ProcessInstanceRequest(requestInfo, List.of(new ProcessInstance())))
        );
        assertEquals("WORKFLOW_SERVICE_EXCEPTION", ex.getCode());
    }
}
