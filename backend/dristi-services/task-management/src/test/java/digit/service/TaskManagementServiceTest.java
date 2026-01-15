package digit.service;

import digit.config.Configuration;
import digit.enrichment.TaskManagementEnrichment;
import digit.kafka.Producer;
import digit.repository.TaskManagementRepository;
import digit.validator.TaskManagementValidator;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementServiceTest {

    @Mock
    private TaskManagementRepository taskManagementRepository;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private DemandService demandService;

    @Mock
    private TaskManagementValidator validator;

    @Mock
    private TaskManagementEnrichment enrichment;

    @Mock
    private Producer producer;

    @Mock
    private Configuration configuration;

    @Mock
    private TaskCreationService taskCreationService;

    @InjectMocks
    private TaskManagementService taskManagementService;

    private TaskManagementRequest request;
    private TaskManagement taskManagement;
    private RequestInfo requestInfo;
    private WorkflowObject workflow;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        workflow = createWorkflowObject("CREATE");
        taskManagement = TaskManagement.builder()
                .id("task-id-123")
                .taskManagementNumber("TM-001")
                .tenantId("kl")
                .filingNumber("KL-2024-001")
                .workflow(workflow)
                .build();
        request = TaskManagementRequest.builder()
                .requestInfo(requestInfo)
                .taskManagement(taskManagement)
                .build();
    }

    private WorkflowObject createWorkflowObject(String action) {
        WorkflowObject wf = new WorkflowObject();
        wf.setAction(action);
        return wf;
    }

    @Test
    void createTaskManagement_WithCreateAction_CreatesDemand() {
        when(configuration.getSaveTaskManagementTopic()).thenReturn("save-task-topic");

        TaskManagement result = taskManagementService.createTaskManagement(request);

        verify(validator).validateCreateRequest(request);
        verify(enrichment).enrichCreateRequest(request);
        verify(demandService).createDemand(request);
        verify(workflowService).updateWorkflowStatus(request);
        verify(producer).push("save-task-topic", request);
        assertEquals(taskManagement, result);
    }

    @Test
    void createTaskManagement_WithNonCreateAction_SkipsDemandCreation() {
        taskManagement.setWorkflow(createWorkflowObject("SUBMIT"));
        when(configuration.getSaveTaskManagementTopic()).thenReturn("save-task-topic");

        taskManagementService.createTaskManagement(request);

        verify(demandService, never()).createDemand(any());
        verify(workflowService).updateWorkflowStatus(request);
        verify(producer).push("save-task-topic", request);
    }

    @Test
    void createTaskManagement_CustomExceptionThrown_WrapsException() {
        doThrow(new CustomException("TEST_ERROR", "Test error message"))
                .when(validator).validateCreateRequest(any());

        CustomException exception = assertThrows(CustomException.class, 
            () -> taskManagementService.createTaskManagement(request));

        assertEquals("CREATE_TASK_MANAGEMENT_EXCEPTION", exception.getCode());
    }

    @Test
    void updateTaskManagement_WithUpdateAction_UpdatesDemand() {
        taskManagement.setWorkflow(createWorkflowObject("UPDATE"));
        when(configuration.getUpdateTaskManagementTopic()).thenReturn("update-task-topic");

        TaskManagement result = taskManagementService.updateTaskManagement(request);

        verify(validator).validateUpdateRequest(request);
        verify(enrichment).enrichUpdateRequest(request);
        verify(demandService).updateDemand(request);
        verify(workflowService).updateWorkflowStatus(request);
        verify(producer).push("update-task-topic", request);
        assertEquals(taskManagement, result);
    }

    @Test
    void updateTaskManagement_WithExpireAction_CancelsDemands() {
        taskManagement.setWorkflow(createWorkflowObject("EXPIRE"));
        when(configuration.getUpdateTaskManagementTopic()).thenReturn("update-task-topic");

        taskManagementService.updateTaskManagement(request);

        verify(demandService).cancelTaskManagementDemands(request);
        verify(demandService, never()).updateDemand(any());
    }

    @Test
    void updateTaskManagement_WithOtherAction_SkipsDemandOperations() {
        taskManagement.setWorkflow(createWorkflowObject("SUBMIT"));
        when(configuration.getUpdateTaskManagementTopic()).thenReturn("update-task-topic");

        taskManagementService.updateTaskManagement(request);

        verify(demandService, never()).updateDemand(any());
        verify(demandService, never()).cancelTaskManagementDemands(any());
    }

    @Test
    void getTaskManagement_ReturnsListFromRepository() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder().tenantId("kl").build();
        Pagination pagination = Pagination.builder().limit(10.0).offSet(0.0).build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .pagination(pagination)
                .build();

        List<TaskManagement> expectedList = Arrays.asList(
                TaskManagement.builder().id("task-1").build(),
                TaskManagement.builder().id("task-2").build()
        );
        when(taskManagementRepository.getTaskManagement(criteria, pagination)).thenReturn(expectedList);

        List<TaskManagement> result = taskManagementService.getTaskManagement(searchRequest);

        assertEquals(2, result.size());
        assertEquals("task-1", result.get(0).getId());
        assertEquals("task-2", result.get(1).getId());
    }

    @Test
    void getTaskManagement_EmptyResult_ReturnsEmptyList() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder().tenantId("kl").build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        when(taskManagementRepository.getTaskManagement(criteria, null)).thenReturn(Collections.emptyList());

        List<TaskManagement> result = taskManagementService.getTaskManagement(searchRequest);

        assertTrue(result.isEmpty());
    }
}
