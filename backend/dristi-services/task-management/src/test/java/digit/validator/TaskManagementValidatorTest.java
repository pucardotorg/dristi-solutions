package digit.validator;

import digit.repository.TaskManagementRepository;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import digit.web.models.TaskSearchCriteria;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementValidatorTest {

    @Mock
    private TaskManagementRepository taskManagementRepository;

    @InjectMocks
    private TaskManagementValidator validator;

    private TaskManagementRequest request;
    private TaskManagement taskManagement;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
        taskManagement = TaskManagement.builder()
                .id("task-id-123")
                .taskManagementNumber("TM-001")
                .tenantId("kl")
                .build();
        request = TaskManagementRequest.builder()
                .requestInfo(requestInfo)
                .taskManagement(taskManagement)
                .build();
    }

    @Test
    void validateCreateRequest_NoException() {
        assertDoesNotThrow(() -> validator.validateCreateRequest(request));
    }

    @Test
    void validateUpdateRequest_NullId_ThrowsException() {
        taskManagement.setId(null);

        CustomException exception = assertThrows(CustomException.class, 
            () -> validator.validateUpdateRequest(request));
        
        assertEquals("TASK_MANAGEMENT_ID_NULL_ERROR", exception.getCode());
        assertEquals("Task management id is null", exception.getMessage());
    }

    @Test
    void validateUpdateRequest_TaskNotFound_ThrowsException() {
        when(taskManagementRepository.getTaskManagement(any(TaskSearchCriteria.class), isNull()))
                .thenReturn(Collections.emptyList());

        CustomException exception = assertThrows(CustomException.class, 
            () -> validator.validateUpdateRequest(request));
        
        assertEquals("TASK_MANAGEMENT_NOT_FOUND_ERROR", exception.getCode());
        assertEquals("Task management not found", exception.getMessage());
    }

    @Test
    void validateUpdateRequest_MultipleTasksFound_ThrowsException() {
        List<TaskManagement> multipleTasks = new ArrayList<>();
        multipleTasks.add(TaskManagement.builder().id("task-1").build());
        multipleTasks.add(TaskManagement.builder().id("task-2").build());
        
        when(taskManagementRepository.getTaskManagement(any(TaskSearchCriteria.class), isNull()))
                .thenReturn(multipleTasks);

        CustomException exception = assertThrows(CustomException.class, 
            () -> validator.validateUpdateRequest(request));
        
        assertEquals("TASK_MANAGEMENT_MULTIPLE_FOUND_ERROR", exception.getCode());
        assertEquals("Multiple task management found", exception.getMessage());
    }

    @Test
    void validateUpdateRequest_SingleTaskFound_NoException() {
        List<TaskManagement> singleTask = Collections.singletonList(
                TaskManagement.builder().id("task-id-123").build()
        );
        
        when(taskManagementRepository.getTaskManagement(any(TaskSearchCriteria.class), isNull()))
                .thenReturn(singleTask);

        assertDoesNotThrow(() -> validator.validateUpdateRequest(request));
    }

    @Test
    void validateUpdateRequest_RepositoryCalledWithCorrectCriteria() {
        List<TaskManagement> singleTask = Collections.singletonList(
                TaskManagement.builder().id("task-id-123").build()
        );
        
        when(taskManagementRepository.getTaskManagement(any(TaskSearchCriteria.class), isNull()))
                .thenReturn(singleTask);

        validator.validateUpdateRequest(request);

        verify(taskManagementRepository).getTaskManagement(
                argThat(criteria -> 
                    criteria.getId().equals("task-id-123") && 
                    criteria.getTaskManagementNumber().equals("TM-001")
                ), 
                isNull()
        );
    }
}
