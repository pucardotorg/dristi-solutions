    package digit.service;

    import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
    import static org.junit.jupiter.api.Assertions.assertEquals;
    import static org.junit.jupiter.api.Assertions.assertNotNull;
    import static org.junit.jupiter.api.Assertions.assertNull;
    import static org.junit.jupiter.api.Assertions.assertThrows;
    import static org.mockito.ArgumentMatchers.any;
    import static org.mockito.ArgumentMatchers.eq;
    import static org.mockito.Mockito.when;

    import java.util.ArrayList;
    import java.util.Collections;
    import java.util.List;

    import digit.config.Configuration;
    import digit.repository.ServiceRequestRepository;
    import digit.web.models.Bail;
    import digit.web.models.BailRequest;
    import digit.web.models.WorkflowObject;
    import org.egov.common.contract.models.Workflow;
    import org.egov.common.contract.request.RequestInfo;
    import org.egov.common.contract.response.ResponseInfo;
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


    import com.fasterxml.jackson.databind.ObjectMapper;

    @ExtendWith(MockitoExtension.class)
    public class WorkflowServiceTest {

        @InjectMocks
        private WorkflowService workflowService;

        @Mock
        private ServiceRequestRepository repository;

        @Mock
        private Configuration config;

        @Mock
        private ObjectMapper mapper;

        private final WorkflowObject workflow = new WorkflowObject();
        @BeforeEach
        void setUp() {
            workflow.setAction("APPROVE");
        }

        @Test
        void updateWorkflowStatus_Success() {
            Bail bail = new Bail();
            bail.setBailId("BAIL123");
            bail.setTenantId("tenant1");
            bail.setWorkflow(new WorkflowObject());

            BailRequest bailRequest = new BailRequest();
            bailRequest.setBail(bail);
            bailRequest.setRequestInfo(new RequestInfo());

            when(config.getWfHost()).thenReturn("http://localhost:8080");
            when(config.getWfTransitionPath()).thenReturn("/workflow/transition");

            ProcessInstance processInstance = new ProcessInstance();
            State state = new State();
            state.setState("APPROVED");  // Set a non-null state here
            processInstance.setState(state);

            ProcessInstanceResponse workflowResponse = new ProcessInstanceResponse(new ResponseInfo(), Collections.singletonList(processInstance));

            // Mock repository.fetchResult to return workflowResponse
            when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(workflowResponse);
            when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class))).thenReturn(workflowResponse);

            // Execute the method and assert no exception thrown
            assertDoesNotThrow(() -> workflowService.updateWorkflowStatus(bailRequest));
        }


        @Test
        void updateWorkflowStatus_CustomException() {
            Bail bail = new Bail();
            bail.setBailId("BAIL123");
            bail.setTenantId("tenant1");
            bail.setWorkflow(new WorkflowObject());

            BailRequest bailRequest = new BailRequest();
            bailRequest.setBail(bail);
            bailRequest.setRequestInfo(new RequestInfo());

            when(config.getWfHost()).thenReturn("http://localhost:8080");
            when(config.getWfTransitionPath()).thenReturn("/workflow/transition");

            ProcessInstance processInstance = new ProcessInstance();
            processInstance.setState(new State());
            ProcessInstanceResponse workflowRequest = new ProcessInstanceResponse(new ResponseInfo(), Collections.singletonList(processInstance));

            // Mock repository.fetchResult
            when(repository.fetchResult(any(StringBuilder.class), any())).thenThrow(new CustomException("Custom error", ""));

            // Execute the method
            assertThrows(CustomException.class, () -> {workflowService.updateWorkflowStatus(bailRequest);
            });
        }

        @Test
        void updateWorkflowStatus_Exception() {
            Bail bail = new Bail();
            bail.setBailId("BAIL123");
            bail.setTenantId("tenant1");
            bail.setWorkflow(new WorkflowObject());

            BailRequest bailRequest = new BailRequest();
            bailRequest.setBail(bail);
            bailRequest.setRequestInfo(new RequestInfo());

            when(config.getWfHost()).thenReturn("http://localhost:8080");
            when(config.getWfTransitionPath()).thenReturn("/workflow/transition");

            ProcessInstance processInstance = new ProcessInstance();
            processInstance.setState(new State());

            // Mock repository.fetchResult
            when(repository.fetchResult(any(StringBuilder.class), any())).thenThrow(new RuntimeException());

            // Execute the method
            assertThrows(Exception.class, () -> {workflowService.updateWorkflowStatus(bailRequest);
            });
        }

        @Test
        void updateWorkflowStatus_ExceptionBis() {
            Bail bail = new Bail();
            bail.setBailId("BAIL123");
            bail.setTenantId("tenant1");
            bail.setWorkflow(new WorkflowObject());

            BailRequest bailRequest = new BailRequest();
            bailRequest.setBail(bail);
            bailRequest.setRequestInfo(new RequestInfo());

            // Execute the method
            assertThrows(Exception.class, () -> {workflowService.updateWorkflowStatus(bailRequest);
            });
        }

        @Test
        void getProcessInstanceForAdvocateRegistrationPayment_Success() {
            Bail bail = new Bail();
            bail.setBailId("BAIL123");
            bail.setTenantId("tenant1");
            bail.setWorkflow(new WorkflowObject());

            BailRequest bailRequest = new BailRequest();
            bailRequest.setBail(bail);
            bailRequest.setRequestInfo(new RequestInfo());

            // Execute the method
            ProcessInstanceRequest processInstanceRequest = workflowService.getProcessInstanceRegistrationPayment(bailRequest);

            // Assertions
            assertNotNull(processInstanceRequest);
            assertEquals(1, processInstanceRequest.getProcessInstances().size());
            assertEquals("ADV", processInstanceRequest.getProcessInstances().get(0).getBusinessService());
        }

        @Test
        void getProcessInstanceForAdvocateRegistrationPayment_Exception() {
            BailRequest bailRequest = new BailRequest();
            bailRequest.setBail(null);  // This will cause NPE inside the method
            bailRequest.setRequestInfo(new RequestInfo());

            assertThrows(CustomException.class, () -> {
                workflowService.getProcessInstanceRegistrationPayment(bailRequest);
            });
        }


        @Test
        void getCurrentWorkflow_Success() {
            // Arrange
            RequestInfo requestInfo = new RequestInfo();
            String tenantId = "tenant1";
            String businessId = "business1";
            ProcessInstanceResponse processInstanceResponse = new ProcessInstanceResponse();
            ProcessInstance processInstance = new ProcessInstance();
            processInstanceResponse.setProcessInstances(Collections.singletonList(processInstance));
            when(config.getWfHost()).thenReturn("http://localhost:8080");
            when(config.getWfProcessInstanceSearchPath()).thenReturn("/workflow/transition");

            when(repository.fetchResult(any(), any())).thenReturn(processInstanceResponse);
            when(mapper.convertValue(processInstanceResponse, ProcessInstanceResponse.class)).thenReturn(processInstanceResponse);

            // Act
            ProcessInstance result = workflowService.getCurrentWorkflow(requestInfo, tenantId, businessId);

            // Assert
            assertNotNull(result);
            assertEquals(processInstance, result);
        }

        @Test
        void getCurrentWorkflow_ProcessInstanceException() {
            // Arrange
            RequestInfo requestInfo = new RequestInfo();
            String tenantId = "tenant1";
            String businessId = "business1";
            ProcessInstanceResponse processInstanceResponse = new ProcessInstanceResponse();
            ProcessInstance processInstance = new ProcessInstance();
            processInstanceResponse.setProcessInstances(Collections.singletonList(processInstance));
            when(config.getWfHost()).thenReturn("http://localhost:8080");
            when(config.getWfProcessInstanceSearchPath()).thenReturn("/workflow/transition");

            when(repository.fetchResult(any(), any())).thenThrow(new RuntimeException("Internal error"));

            // Act and Assert
            assertThrows(Exception.class, () -> {
                workflowService.getCurrentWorkflow(requestInfo, tenantId, businessId);
            });
        }

        @Test
        void getWorkflowFromProcessInstance_returnsWorkflowWhenProcessInstanceIsNotNull() {
            ProcessInstance processInstance = new ProcessInstance();
            State state = new State();
            state.setState("APPROVE");
            processInstance.setState(state);
            processInstance.setComment("Test Comment");

            Workflow result = workflowService.getWorkflowFromProcessInstance(processInstance);

            assertNotNull(result);
            assertEquals("APPROVE", result.getAction());
            assertEquals("Test Comment", result.getComments());
        }

        @Test
        void getWorkflowFromProcessInstance_returnsNullWhenProcessInstanceIsNull() {
            ProcessInstance processInstance = null;

            Workflow result = workflowService.getWorkflowFromProcessInstance(processInstance);

            assertNull(result);
        }
    /*
        @Test
        void getProcessInstanceForCasePayment_returnsProcessInstanceRequest() {
            CaseSearchRequest updateRequest = new CaseSearchRequest();
            CaseCriteria caseCriteria = new CaseCriteria();
            caseCriteria.setFilingNumber("filingNumber");
            updateRequest.setCriteria(Collections.singletonList(caseCriteria));
            updateRequest.setRequestInfo(new RequestInfo());
            String tenantId = "tenantId";

            when(config.getCaseBusinessServiceName()).thenReturn("caseBusinessServiceName");
            when(config.getCaseBusinessName()).thenReturn("caseBusinessName");

            ProcessInstanceRequest result = workflowService.getProcessInstanceForCasePayment(updateRequest, tenantId);

            assertNotNull(result);
            assertEquals("MAKE_PAYMENT", result.getProcessInstances().get(0).getAction());
            assertEquals("caseBusinessServiceName", result.getProcessInstances().get(0).getBusinessService());
            assertEquals("caseBusinessName", result.getProcessInstances().get(0).getModuleName());
            assertEquals("filingNumber", result.getProcessInstances().get(0).getBusinessId());
            assertEquals("Payment for Case processed", result.getProcessInstances().get(0).getComment());
            assertEquals(tenantId, result.getProcessInstances().get(0).getTenantId());
        }

        @Test
        void getProcessInstanceForCasePayment_throwsExceptionWhenCaseCriteriaIsNull() {
            CaseSearchRequest updateRequest = new CaseSearchRequest();
            updateRequest.setCriteria(null);
            updateRequest.setRequestInfo(new RequestInfo());
            String tenantId = "tenantId";

            assertThrows(Exception.class, () -> workflowService.getProcessInstanceForCasePayment(updateRequest, tenantId));
        }*/


    }
