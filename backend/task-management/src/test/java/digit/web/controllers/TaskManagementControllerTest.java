package digit.web.controllers;

import digit.service.TaskCreationService;
import digit.service.TaskManagementService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementControllerTest {

    @Mock
    private TaskManagementService taskManagementService;

    @Mock
    private ResponseInfoFactory responseInfoFactory;

    @Mock
    private TaskCreationService taskCreationService;

    @InjectMocks
    private TaskManagementController controller;

    private RequestInfo requestInfo;
    private TaskManagement taskManagement;
    private TaskManagementRequest request;
    private ResponseInfo responseInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        taskManagement = TaskManagement.builder()
                .id("task-id-123")
                .taskManagementNumber("TM-001")
                .tenantId("kl")
                .filingNumber("KL-2024-001")
                .build();
        request = TaskManagementRequest.builder()
                .requestInfo(requestInfo)
                .taskManagement(taskManagement)
                .build();
        responseInfo = ResponseInfo.builder()
                .status("successful")
                .build();
    }

    @Test
    void createTaskManagement_Success_ReturnsOkResponse() {
        when(taskManagementService.createTaskManagement(any())).thenReturn(taskManagement);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<TaskManagementResponse> result = controller.createTaskManagement(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(taskManagement, result.getBody().getTaskManagement());
        assertEquals(responseInfo, result.getBody().getResponseInfo());
    }

    @Test
    void updateTaskManagement_Success_ReturnsOkResponse() {
        when(taskManagementService.updateTaskManagement(any())).thenReturn(taskManagement);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<TaskManagementResponse> result = controller.updateTaskManagement(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(taskManagement, result.getBody().getTaskManagement());
    }

    @Test
    void getTaskManagement_WithResults_ReturnsAcceptedResponse() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder().tenantId("kl").build();
        Pagination pagination = Pagination.builder().limit(10.0).offSet(0.0).totalCount(2.0).build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .pagination(pagination)
                .build();

        List<TaskManagement> taskList = Arrays.asList(
                TaskManagement.builder().id("task-1").build(),
                TaskManagement.builder().id("task-2").build()
        );

        when(taskManagementService.getTaskManagement(any())).thenReturn(taskList);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<TaskManagementSearchResponse> result = controller.getTaskManagement(searchRequest);

        assertEquals(HttpStatus.ACCEPTED, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(2, result.getBody().getTaskManagementRecords().size());
        assertEquals(2, result.getBody().getTotalCount());
    }

    @Test
    void getTaskManagement_WithoutPagination_UsesListSize() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder().tenantId("kl").build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .pagination(null)
                .build();

        List<TaskManagement> taskList = Arrays.asList(
                TaskManagement.builder().id("task-1").build(),
                TaskManagement.builder().id("task-2").build(),
                TaskManagement.builder().id("task-3").build()
        );

        when(taskManagementService.getTaskManagement(any())).thenReturn(taskList);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<TaskManagementSearchResponse> result = controller.getTaskManagement(searchRequest);

        assertEquals(3, result.getBody().getTotalCount());
    }

    @Test
    void getTaskManagement_EmptyResults_ReturnsEmptyList() {
        TaskSearchCriteria criteria = TaskSearchCriteria.builder().tenantId("kl").build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        when(taskManagementService.getTaskManagement(any())).thenReturn(Collections.emptyList());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        ResponseEntity<TaskManagementSearchResponse> result = controller.getTaskManagement(searchRequest);

        assertNotNull(result.getBody());
        assertTrue(result.getBody().getTaskManagementRecords().isEmpty());
        assertEquals(0, result.getBody().getTotalCount());
    }

    @Test
    void generateFollowUpTasks_Success_DoesNotThrow() {
        doNothing().when(taskCreationService).generateFollowUpTasks(any(), any());

        assertDoesNotThrow(() -> controller.generateFollowUpTasks(request));

        verify(taskCreationService).generateFollowUpTasks(requestInfo, taskManagement);
    }

    @Test
    void generateFollowUpTasks_Exception_DoesNotPropagate() {
        doThrow(new RuntimeException("Test error"))
                .when(taskCreationService).generateFollowUpTasks(any(), any());

        assertDoesNotThrow(() -> controller.generateFollowUpTasks(request));
    }

    @Test
    void createTaskManagement_ServiceInteraction() {
        when(taskManagementService.createTaskManagement(any())).thenReturn(taskManagement);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        controller.createTaskManagement(request);

        verify(taskManagementService, times(1)).createTaskManagement(request);
        verify(responseInfoFactory, times(1)).createResponseInfoFromRequestInfo(requestInfo, true);
    }

    @Test
    void updateTaskManagement_ServiceInteraction() {
        when(taskManagementService.updateTaskManagement(any())).thenReturn(taskManagement);
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true))).thenReturn(responseInfo);

        controller.updateTaskManagement(request);

        verify(taskManagementService, times(1)).updateTaskManagement(request);
    }
}
