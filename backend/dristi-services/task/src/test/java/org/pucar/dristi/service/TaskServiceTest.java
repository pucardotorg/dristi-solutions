package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.TaskRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.validators.TaskRegistrationValidator;
import org.pucar.dristi.web.models.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.*;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private TaskRegistrationValidator validator;

    @Mock
    private TaskRegistrationEnrichment enrichmentUtil;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private WorkflowUtil workflowUtil;

    @Mock
    private Configuration config;

    @Mock
    private Producer producer;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private ObjectMapper objectMapper;

    @Spy
    @InjectMocks
    private TaskService taskService;

    private TaskRequest taskRequest;
    private Task task;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        task = new Task();
        task.setTenantId("tenant-id");
        task.setCnrNumber("cnr-number");
        task.setTaskNumber("task-number");
        task.setTaskType("doc");

        requestInfo = RequestInfo.builder().build();

        taskRequest = new TaskRequest();
        taskRequest.setTask(task);
        taskRequest.setRequestInfo(requestInfo);
    }

    @Test
    void testCreateTaskSuccess() {
        when(config.getTaskBusinessServiceName()).thenReturn("task-business-service");
        when(config.getTaskBusinessName()).thenReturn("task-business-name");

        doNothing().when(validator).validateTaskRegistration(any(TaskRequest.class));
        doNothing().when(enrichmentUtil).enrichTaskRegistration(any(TaskRequest.class));

        Task result = taskService.createTask(taskRequest);

        assertEquals(task, result);
        verify(validator, times(1)).validateTaskRegistration(any(TaskRequest.class));
        verify(enrichmentUtil, times(1)).enrichTaskRegistration(any(TaskRequest.class));
        verify(workflowUtil, times(1)).updateWorkflowStatus(any(RequestInfo.class), anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    public void testCreateTask_CustomException() {
        doThrow(new CustomException("VALIDATION_ERROR", "Validation failed")).when(validator).validateTaskRegistration(any(TaskRequest.class));

        CustomException exception = assertThrows(CustomException.class, () -> taskService.createTask(taskRequest));

        verify(validator, times(1)).validateTaskRegistration(taskRequest);
        assertEquals("VALIDATION_ERROR", exception.getCode());
        assertEquals("Validation failed", exception.getMessage());
    }

    @Test
    public void testCreateTask_Exception() {

        doThrow(new RuntimeException("Unexpected error")).when(validator).validateTaskRegistration(any(TaskRequest.class));

        CustomException exception = assertThrows(CustomException.class, () -> taskService.createTask(taskRequest));

        verify(validator, times(1)).validateTaskRegistration(taskRequest);
        assertEquals(CREATE_TASK_ERR, exception.getCode());
        assertEquals("Unexpected error", exception.getMessage());
    }

    @Test
    void testSearchTaskSuccess() {
        when(taskRepository.getTasks(any(),any())).thenReturn(Collections.singletonList(task));

        List<Task> result = taskService.searchTask(new TaskSearchRequest());

        assertEquals(1, result.size());
        verify(taskRepository, times(1)).getTasks(any(),any());
    }

    @Test
    void testSearchTaskThrowsException() {
        doThrow(new RuntimeException("Unexpected error")).when(taskRepository).getTasks(any(TaskCriteria.class),any());
        assertThrows(CustomException.class, this::invokeSearchTask);
    }


    @Test
    void testSearchTaskThrows_CustomException() {
        when(taskRepository.getTasks(any(),any())).thenThrow(new CustomException(SEARCH_TASK_ERR, "Error"));

        CustomException exception = assertThrows(CustomException.class, this::invokeSearchTask);

        assertEquals(SEARCH_TASK_ERR, exception.getCode());
        assertEquals("Error", exception.getMessage());
    }

    private void invokeSearchTask() {
        taskService.searchTask(new TaskSearchRequest());
    }

    @Test
    void testUpdateTaskSuccess() {
        when(validator.validateApplicationExistence(any(Task.class), any(RequestInfo.class))).thenReturn(true);
        when(config.getTaskBusinessServiceName()).thenReturn("task-business-service");
        when(config.getTaskBusinessName()).thenReturn("task-business-name");
        when(config.getTaskUpdateTopic()).thenReturn("task-update-topic");

        doNothing().when(enrichmentUtil).enrichCaseApplicationUponUpdate(any(TaskRequest.class));

        Task result = taskService.updateTask(taskRequest);

        assertEquals(task, result);
        verify(validator, times(1)).validateApplicationExistence(any(Task.class), any(RequestInfo.class));
        verify(enrichmentUtil, times(1)).enrichCaseApplicationUponUpdate(any(TaskRequest.class));
        verify(workflowUtil, times(1)).updateWorkflowStatus(any(RequestInfo.class), anyString(), anyString(), anyString(), any(), anyString());
        verify(producer, times(1)).push(anyString(), any(TaskRequest.class));
    }

    @Test
    void testUpdateTaskThrows_CustomException() {
        when(validator.validateApplicationExistence(any(Task.class), any(RequestInfo.class))).thenReturn(false);

        CustomException exception = assertThrows(CustomException.class, () -> taskService.updateTask(taskRequest));

        assertEquals(VALIDATION_ERR, exception.getCode());
        assertEquals("Task Application does not exist", exception.getMessage());
    }

    @Test
     void testUpdateTaskThrowsException() {
        doThrow(new RuntimeException("Unexpected error")).when(enrichmentUtil).enrichTaskRegistration(any(TaskRequest.class));
        when(validator.validateApplicationExistence(any(Task.class), any(RequestInfo.class))).thenReturn(true);
        assertThrows(CustomException.class, this::invokeUpdateTask);
    }

    private void invokeUpdateTask() {
        taskService.updateTask(new TaskRequest());
    }

    @Test
    void testExistTaskSuccess() {
        TaskExists taskExists = new TaskExists();
        when(taskRepository.checkTaskExists(any(TaskExists.class))).thenReturn(taskExists);

        TaskExistsRequest taskExistsRequest = new TaskExistsRequest();
        taskExistsRequest.setTask(new TaskExists());

        TaskExists result = taskService.existTask(taskExistsRequest);

        assertEquals(taskExists, result);
        verify(taskRepository, times(1)).checkTaskExists(any(TaskExists.class));
    }

    @Test
    void testExistTaskThrows_Exception() {

        doThrow(new RuntimeException("Unexpected error")).when(taskRepository).checkTaskExists(any());
        assertThrows(CustomException.class,  this::invokeExistTask);
    }

    private void invokeExistTask() {
        taskService.existTask(new TaskExistsRequest());
    }

    @Test
    void testExistTaskThrows_CustomException() {
        when(taskRepository.checkTaskExists(any(TaskExists.class))).thenThrow(new CustomException(EXIST_TASK_ERR, "Error"));

        TaskExistsRequest taskExistsRequest = new TaskExistsRequest();
        taskExistsRequest.setTask(new TaskExists());

        CustomException exception = assertThrows(CustomException.class, () -> taskService.existTask(taskExistsRequest));

        assertEquals(EXIST_TASK_ERR, exception.getCode());
        assertEquals("Error", exception.getMessage());
    }

    @Test
    void testWorkflowUpdate_BailTask() {
        task.setTaskType("bail"); // Task type in lowercase
        task.setTenantId("tenant1");
        task.setTaskNumber("T123");

        taskRequest.setTask(task);

        when(config.getTaskBailBusinessServiceName()).thenReturn("bail_service");
        when(config.getTaskBailBusinessName()).thenReturn("bail_business");

        taskService.createTask(taskRequest);

        verify(workflowUtil).updateWorkflowStatus(any(), eq("tenant1"), eq("T123"), eq("bail_service"), any(), eq("bail_business"));
    }

    @Test
    void testWorkflowUpdate_SummonTask() {
        task.setTaskType("summons");
        task.setTenantId("tenant2");
        task.setTaskNumber("T456");

        taskRequest.setTask(task);

        when(config.getTaskSummonBusinessServiceName()).thenReturn("task-summon-service");
        when(config.getTaskSummonBusinessName()).thenReturn("task-summon");

        doNothing().when(taskService).updateCase(any(TaskRequest.class));
        taskService.createTask(taskRequest);

        verify(workflowUtil).updateWorkflowStatus(any(), eq("tenant2"), eq("T456"),
                eq("task-summon-service"), any(), eq("task-summon"));
    }


    @Test
    void testWorkflowUpdate_WarrantTask() {
        task.setTaskType("warrant"); // Task type in lowercase
        task.setTenantId("tenant3");
        task.setTaskNumber("T789");

        taskRequest.setTask(task);

        when(config.getTaskWarrantBusinessServiceName()).thenReturn("warrant_service");
        when(config.getTaskWarrantBusinessName()).thenReturn("warrant_business");
        doNothing().when(taskService).updateCase(any(TaskRequest.class));

        taskService.createTask(taskRequest);

        verify(workflowUtil).updateWorkflowStatus(any(), eq("tenant3"), eq("T789"), eq("warrant_service"), any(), eq("warrant_business"));
    }

    @Test
    void testWorkflowUpdate_DefaultTask() {
        task.setTaskType("unknown_task"); // Task type not recognized
        task.setTenantId("tenant4");
        task.setTaskNumber("T999");

        taskRequest.setTask(task);

        when(config.getTaskBusinessServiceName()).thenReturn("default_service");
        when(config.getTaskBusinessName()).thenReturn("default_business");

        taskService.createTask(taskRequest);

        verify(workflowUtil).updateWorkflowStatus(any(), eq("tenant4"), eq("T999"), eq("default_service"), any(), eq("default_business"));
    }

    @Test
    void testUpdateCase_Success() {
        CourtCase courtCase = new CourtCase();
        courtCase.setAdditionalDetails(Map.of());

        ObjectNode mockedTaskDetails = new ObjectNode(JsonNodeFactory.instance);
        ObjectNode respondentDetails = mockedTaskDetails.put("respondentDetails", 1);
        ObjectNode address = respondentDetails.putObject("address");
        address.put("id", "addr1");
        address.set("geoLocation", new TextNode("mockGeo"));

        JsonNode mockedAdditionalDetails = createMockedAdditionalDetails();

        when(caseUtil.getCaseDetails(taskRequest)).thenReturn(List.of(courtCase));
        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(mockedAdditionalDetails);

        taskService.updateCase(taskRequest);

        verify(caseUtil).editCase(eq(requestInfo), any(CourtCase.class));
    }

    @Test
    void testUpdateCase_NoCasesFound_ShouldThrowException() {
        when(caseUtil.getCaseDetails(taskRequest)).thenReturn(Collections.emptyList());

        CustomException exception = assertThrows(CustomException.class, () ->
                taskService.updateCase(taskRequest)
        );

        assertEquals("ERROR_WHILE_FETCHING_FROM_CASE_SERVICE", exception.getCode());
    }
    private JsonNode createMockedAdditionalDetails() {
        ObjectNode root = JsonNodeFactory.instance.objectNode();
        ArrayNode formDataArray = JsonNodeFactory.instance.arrayNode();

        ObjectNode formData = JsonNodeFactory.instance.objectNode();
        ObjectNode data = JsonNodeFactory.instance.objectNode();
        ArrayNode addressDetails = JsonNodeFactory.instance.arrayNode();

        ObjectNode address = JsonNodeFactory.instance.objectNode();
        address.put("id", "addr1");
        address.put("geoLocation", "oldGeo");

        addressDetails.add(address);
        data.set("addressDetails", addressDetails);
        formData.set("data", data);
        formDataArray.add(formData);

        root.set("respondentDetails", JsonNodeFactory.instance.objectNode().set("formdata", formDataArray));

        return root;
    }
}
